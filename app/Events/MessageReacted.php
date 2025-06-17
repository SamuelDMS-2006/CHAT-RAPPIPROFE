<?php

namespace App\Events;

use App\Models\MessageReaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageReacted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reaction;
    public $action; // 'add' o 'remove'

    public function __construct(MessageReaction $reaction, $action = 'add')
    {
        $this->reaction = $reaction->load('user');
        $this->action = $action;
    }


    public function broadcastOn()
    {
        $message = $this->reaction->message;

        if ($message->group_id) {
            return [new PrivateChannel('message.group.' . $message->group_id)];
        } else {
            $ids = collect([$message->sender_id, $message->receiver_id])->sort()->implode('-');
            return [new PrivateChannel('message.user.' . $ids)];
        }
    }


    public function broadcastWith()
    {
        return [
            'reaction' => [
                'id' => $this->reaction->id,
                'message_id' => $this->reaction->message_id,
                'user' => [
                    'id' => $this->reaction->user->id,
                    'name' => $this->reaction->user->name,
                ],
                'emoji' => $this->reaction->reaction,
                'action' => $this->action,
            ],
        ];
    }
}
