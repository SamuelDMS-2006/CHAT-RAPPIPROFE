<?php

namespace App\Http\Controllers;

use App\Events\MessageReacted;
use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Http\Request;

class MessageReactionController extends Controller
{
    public function react(Request $request, Message $message)
    {
        $request->validate([
            'reaction' => 'required|string|max:32',
        ]);

        $user = $request->user();

        // Actualiza o crea la reacción
        $reaction = MessageReaction::updateOrCreate(
            ['message_id' => $message->id, 'user_id' => $user->id],
            ['reaction' => $request->reaction]
        );

        broadcast(new MessageReacted($reaction, 'add'))->toOthers();

        return response()->json(['success' => true, 'reaction' => $reaction]);
    }

    public function remove(Message $message)
    {
        $user = auth()->user();
        $reaction = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->first();

        if ($reaction) {
            broadcast(new MessageReacted($reaction, 'remove'))->toOthers();
            $reaction->delete();
        }

        return response()->json(['success' => true]);
    }
}
