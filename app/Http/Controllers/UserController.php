<?php

namespace App\Http\Controllers;

use App\Mail\UserBlockedUnblocked;
use App\Mail\UserCreated;
use App\Mail\UserRoleChanged;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'password' => 'required|string|min:6',
            'email' => ['required', 'email', 'unique:users,email'],
            'telefono' => 'required|string|min:9',
            'is_admin' => 'boolean',
            'is_asesor' => 'boolean',
        ]);

        $rawPassword = $request->password; // Guardas la versión sin encriptar
        $data = $request->only('name', 'email', 'is_admin', 'is_asesor', 'telefono');
        $data['password'] = bcrypt($rawPassword); // Encriptas
        $data['email_verified_at'] = now();

        $user = User::create($data);

        Mail::to($user)->send(new UserCreated($user, $rawPassword));

        return redirect()->back();
    }

    public function checkPhone(Request $request)
    {
        $request->validate(['telefono' => 'required|string']);
        $userExists = User::where('telefono', $request->telefono)->exists();
        return response()->json(['exists' => $userExists]);
    }

    public function setRoleAdmin(User $user)
    {
        $user->update(['is_admin' => !(bool) $user->is_admin]);
        $message = "User role was changed into " . ($user->is_admin ? '"Admin"' : '"Regular User"');

        Mail::to($user)->send(new UserRoleChanged($user));

        return response()->json(['message' => $message]);
    }

    public function setRoleAsesor(User $user)
    {
        $user->update(['is_asesor' => !(bool) $user->is_asesor]);
        $message = "User role was changed into " . ($user->is_asesor ? '"Asesor"' : '"Regular User"');

        Mail::to($user)->send(new UserRoleChanged($user));

        return response()->json(['message' => $message]);
    }

    public function asignGroup(User $user, $groupId)
    {
        $user->update(['group_asigned' => (int) $groupId]);
        $message = "Asesor asignado correctamente.";

        return response()->json(['message' => $message]);
    }


    public function blockUnblock(User $user)
    {
        if ($user->blocked_at) {
            $user->blocked_at = null;
            $message = 'User "' . $user->name . '" has been activated';
        } else {
            $user->blocked_at = now();
            $message = 'User "' . $user->name . '" has been blocked';
        }
        $user->save();

        Mail::to($user)->send(new UserBlockedUnblocked($user));

        return response()->json(['message' => $message]);
    }
}
