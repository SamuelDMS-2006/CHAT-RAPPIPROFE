<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Group;
use App\Jobs\DeleteGroupJob;
use App\Events\SocketGroups;
use Illuminate\Support\Facades\DB;
use App\Events\GroupStatusChanged;
use App\Events\UsersNotifications;
use App\Events\asignedGroup;
use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class GroupController extends Controller
{

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGroupRequest $request)
    {
        $data = $request->validated();
        $user_ids = $data['user_ids'] ?? [];
        $group = Group::create($data);
        $group->users()->attach(array_unique([$request->user()->id, ...$user_ids]));

        return redirect()->back();
    }


    public function asignAsesor(Group $group, $asesorId)
    {
        try {
            DB::beginTransaction();

            $idsAEliminar = $group->users()
                ->where(function ($query) use ($group) {
                    $query->where('users.id', $group->asesor)
                        ->orWhere('users.is_asesor', true);
                })
                ->where('users.id', '!=', $asesorId)
                ->where('users.is_admin', false)
                ->pluck('users.id');

            if ($idsAEliminar->isNotEmpty()) {
                $group->users()->detach($idsAEliminar);
            }

            $group->users()->syncWithoutDetaching([$asesorId]);

            $group->update(['asesor' => (int) $asesorId]);

            DB::commit();

            $group->refresh()->load('users');

            broadcast(new SocketGroups($group, 'asesor_changed'))->toOthers();

            return response()->json(['message' => 'Asesor asignado correctamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Ocurrió un error al asignar el asesor.'], 500);
        }
    }


    public function changeStatus(Group $group, $code_status)
    {
        $group->update(['code_status' => (int) $code_status]);
        broadcast(new SocketGroups($group->refresh(), 'status_changed'))->toOthers();
        return response()->json(['message' => 'Estado asignado correctamente.']);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGroupRequest $request, Group $group)
    {
        $data = $request->validated();
        $user_ids = $data['user_ids'] ?? [];
        $group->update($data);

        // Remove all users and attach the new ones
        $group->users()->detach();
        $group->users()->attach(array_unique([$request->user()->id, ...$user_ids]));

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Group $group)
    {
        // Check if the user is onwer of the group
        if ($group->owner_id !== auth()->id()) {
            abort(403);
        }

        DeleteGroupJob::dispatch($group)->delay(now()->addSeconds(10));

        return response()->json(['message' => 'Group delete was scheduled and will be deleted soon']);
    }

    public function createForClient(Request $request)
    {
        try {
            $shouldNotify = false;
            $user = User::where('telefono', $request->telefono)->first();
            $group = DB::transaction(function () use ($request, $user, &$shouldNotify) {

                if ($user) {
                    $request->validate([
                        'telefono' => 'required|string',
                        'password' => 'required|string',
                    ]);

                    if (!Auth::attempt(['telefono' => $request->telefono, 'password' => $request->password])) {
                        throw new \Exception('Las credenciales para el usuario existente son inválidas.');
                    }

                    if ($user->group_asigned) {
                        $group = Group::find($user->group_asigned);
                        if (!$group) {
                            throw new \Exception('El grupo asignado al usuario no fue encontrado.');
                        }
                    } else {
                        $asesores = User::where('is_asesor', true)->get();
                        if ($asesores->isEmpty()) {
                            throw new \Exception('No hay asesores disponibles para asignar.');
                        }
                        $asesor = $asesores->first();

                        $group = Group::create([
                            'name'     => $user->telefono . ' - ' . $user->name,
                            'owner_id' => $asesor->id,
                            'asesor'   => $asesor->id,
                        ]);

                        $user->update(['group_asigned' => $group->id]);

                        $shouldNotify = true;
                    }

                    return $group;
                } else {
                    $shouldNotify = true;

                    $request->validate([
                        'telefono' => 'required|string|max:30|unique:users,telefono',
                        'nombre'   => 'required|string|max:100',
                        'email'    => 'required|email|max:255|unique:users,email',
                    ]);

                    $asesores = User::where('is_asesor', true)->get();
                    if ($asesores->isEmpty()) {
                        throw new \Exception('No hay asesores disponibles para asignar.');
                    }
                    $asesor = $asesores->first();

                    $group = Group::create([
                        'name'     => $request->telefono . ' - ' . $request->nombre,
                        'owner_id' => $asesor->id,
                        'asesor'   => $asesor->id,
                    ]);

                    $newUser = User::create([
                        'name'          => $request->nombre,
                        'email'         => $request->email,
                        'telefono'      => $request->telefono,
                        'group_asigned' => $group->id,
                        'password'      => Hash::make($request->password ?? 'password'),
                    ]);

                    $userIds = $asesores->pluck('id')->toArray();
                    $userIds[] = $newUser->id;
                    $group->users()->attach(array_unique($userIds));

                    auth()->login($newUser);

                    return $group;
                }
            });

            if ($shouldNotify) {
                $admins = User::where('is_asesor', true)->get();
                foreach ($admins as $admin) {
                    broadcast(new UsersNotifications($group, "Nuevo cliente registrado: {$request->telefono}", $admin->id));
                }
            }

            return response()->json(['group_id' => $group->id]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Datos inválidos.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
