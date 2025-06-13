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
        return new PrivateChannel('chat.message.' . $this->reaction->message_id);
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