<?php

use App\Http\Controllers\GroupController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MessageReactionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Helpers\QuickReplies;

Route::get('/landing', function () {
    return Inertia::render('LandingPage');
});

Route::post('/groups/create-for-client', [GroupController::class, 'createForClient'])->name('groups.createForClient');

Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('/', [HomeController::class, 'home'])->name('dashboard');

    Route::get('user/{user}', [MessageController::class, 'byUser'])->name('chat.user');
    Route::get('group/{group}', [MessageController::class, 'byGroup'])->name('chat.group');

    Route::post('/message', [MessageController::class, 'store'])->name('message.store');
    Route::delete('/message/{message}', [MessageController::class, 'destroy'])->name('message.destroy');
    Route::get('/message/older/{message}', [MessageController::class, 'loadOlder'])->name('message.loadOlder');

    Route::post('/group', [GroupController::class, 'store'])->name('group.store');
    Route::put('/group/{group}', [GroupController::class, 'update'])->name('group.update');
    Route::delete('/group/{group}', [GroupController::class, 'destroy'])->name('group.destroy');

    Route::post('/messages/{message}/react', [MessageReactionController::class, 'react']);
    Route::delete('/messages/{message}/react', [MessageReactionController::class, 'remove']);

    Route::get('/quick-replies', function (\Illuminate\Http\Request $request) {
        $role = $request->query('role', 'asesor');
        $replies = QuickReplies::getReplies($role);
        $result = [];
        foreach ($replies as $label => $value) {
            $result[] = ['label' => $label, 'value' => $value];
        }
        return response()->json($result);
    });

    Route::middleware(['asesor'])->group(function () {
        Route::post('/user', [UserController::class, 'store'])->name('user.store');
        Route::post('/user/set-asesor/{user}', [UserController::class, 'setRoleAsesor'])->name('user.setRoleAsesor');
        Route::post('/user/set-admin/{user}', [UserController::class, 'setRoleAdmin'])->name('user.setRoleAdmin');
        Route::post('/groups/{group}/asign-asesor/{asesor}', [GroupController::class, 'asignAsesor'])->name('group.asignAsesor');
        Route::post('/groups/{group}/change-status/{newStatus}', [GroupController::class, 'changeStatus'])->name('group.changeStatus');

        Route::post('/user/block-unblock/{user}', [UserController::class, 'blockUnblock'])
            ->name('user.blockUnblock');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
