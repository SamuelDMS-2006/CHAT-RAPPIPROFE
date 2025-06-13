<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Jobs\DeleteGroupJob;
use App\Events\SocketGroups;
use Illuminate\Support\Facades\DB;
use App\Events\GroupStatusChanged;
use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;


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
            $oldAsesorId = $group->asesor;

            if ($oldAsesorId && $oldAsesorId != $asesorId) {
                $group->users()->detach($oldAsesorId);
            }


            $group->users()->syncWithoutDetaching([$asesorId]);

            $group->update(['asesor' => (int) $asesorId]);

            DB::commit();

            $group->refresh();

            broadcast(new SocketGroups($group, 'asesor_changed'))->toOthers();

            $message = "Asesor asignado correctamente.";
            return response()->json(['message' => $message]);
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

    public function createForClient(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'telefono' => 'required|string|max:30',
            'nombre' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:users,email',
        ]);

        try {
            $group = DB::transaction(function () use ($request) {
                $asesor = User::where('is_asesor', true)
                    ->inRandomOrder()
                    ->first();

                if (!$asesor) {
                    throw new \Exception('No hay asesores disponibles para asignar.');
                }

                $admin = User::where('is_admin', true)->first();
                if (!$admin) {
                    throw new \Exception('No se encontró un usuario administrador para asignar.');
                }

                $group = Group::create([
                    'name' => $request->telefono . ' - ' . $request->nombre,
                    'owner_id' => $asesor->id,
                    'asesor' => $asesor->id,
                ]);

                $user = User::create([
                    'name' => $request->nombre,
                    'email' => $request->email,
                    'group_asigned' => $group->id,
                    'password' => Hash::make($request->telefono),
                ]);

                $usersToAttach = array_unique([$user->id, $asesor->id, $admin->id]);
                $group->users()->attach($usersToAttach);

                auth()->login($user);

                return $group;
            });

            return response()->json(['group_id' => $group->id]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
