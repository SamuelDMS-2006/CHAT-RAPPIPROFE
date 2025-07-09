<?php

namespace App\Http\Controllers;

use App\Events\SocketMessage;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * Muestra los mensajes entre el usuario autenticado y otro usuario.
     */
    public function byUser(User $user)
    {
        $authUser = auth()->user();

        // Redirige si el usuario no es admin ni asesor
        if (!$authUser->is_admin && !$authUser->is_asesor) {
            return redirect()->route('chat.group', ['group' => $authUser->group_asigned]);
        }

        // Obtiene los mensajes entre ambos usuarios
        $messages = Message::with(['sender', 'attachments', 'replyTo', 'reactions'])
            ->where(function ($query) use ($authUser, $user) {
                $query->where('sender_id', $authUser->id)->where('receiver_id', $user->id)
                    ->orWhere('sender_id', $user->id)->where('receiver_id', $authUser->id);
            })->latest()->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $user->toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }

    /**
     * Muestra los mensajes de un grupo.
     */
    public function byGroup(Group $group)
    {
        $authUser = auth()->user();

        // Redirige si el usuario no pertenece al grupo
        if (!$authUser->is_admin && !$authUser->is_asesor) {
            if ($group->id != $authUser->group_asigned) {
                return redirect()->route('chat.group', ['group' => $authUser->group_asigned]);
            }
        }

        $messages = Message::with(['sender', 'attachments', 'replyTo', 'reactions'])
            ->where('group_id', $group->id)
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $group->toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }

    /**
     * Carga mensajes anteriores a uno dado (paginación infinita).
     */
    public function loadOlder(Message $message)
    {
        if ($message->group_id) {
            $messages = Message::with(['sender', 'attachments', 'replyTo', 'reactions'])
                ->where('created_at', '<', $message->created_at)
                ->where('group_id', $message->group_id)
                ->latest()
                ->paginate(10);
        } else {
            $messages = Message::with(['sender', 'attachments', 'replyTo', 'reactions'])
                ->where('created_at', '<', $message->created_at)
                ->where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
                ->latest()
                ->paginate(10);
        }

        return MessageResource::collection($messages);
    }

    /**
     * Guarda un nuevo mensaje (privado o grupal), con soporte para adjuntos y reply.
     */
    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = auth()->id();
        $receiverId = $data['receiver_id'] ?? null;
        $groupId = $data['group_id'] ?? null;
        $files = $data['attachments'] ?? [];

        // Crea el mensaje
        $message = Message::create($data);

        // Procesa y guarda los adjuntos si existen
        $attachments = [];
        if ($files) {
            foreach ($files as $file) {
                $directory = 'attachments/' . Str::random(32);
                Storage::makeDirectory($directory);

                $model = [
                    'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'path' => $file->store($directory, 'public'),
                ];
                $attachment = MessageAttachment::create($model);
                $attachments[] = $attachment;
            }
            $message->attachments = $attachments;
        }

        // Actualiza la conversación o grupo con el último mensaje
        if ($receiverId) {
            Conversation::updateConversationWithMessage($receiverId, auth()->id(), $message);
        }
        if ($groupId) {
            Group::updateGroupWithMessage($groupId, $message);
        }

        // Dispara el evento para comunicación en tiempo real
        SocketMessage::dispatch($message);

        // Devuelve el mensaje como recurso
        return new MessageResource($message);
    }

    /**
     * Elimina un mensaje si el usuario autenticado es el propietario.
     */
    public function destroy(Message $message)
    {

        $group = null;
        $conversation = null;

        // Verifica si el mensaje es el último del grupo o conversación
        if ($message->group_id) {
            $group = Group::where('last_message_id', $message->id)->first();
        } else {
            $conversation = Conversation::where('last_message_id', $message->id)->first();
        }

        $message->delete();

        $lastMessage = null;
        if ($group) {
            $group = Group::find($group->id);
            $lastMessage = $group->lastMessage;
        } else if ($conversation) {
            $conversation = Conversation::find($conversation->id);
            $lastMessage = $conversation->lastMessage;
        }

        return response()->json(['message' => $lastMessage ? new MessageResource($lastMessage) : null]);
    }
}
