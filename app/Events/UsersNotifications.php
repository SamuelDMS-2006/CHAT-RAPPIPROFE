<?php

namespace App\Events;

use App\Http\Resources\GroupResource;
use App\Models\Group;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UsersNotifications implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Group $group;
    public string $message;
    public int $adminId;

    public function __construct(Group $group, string $message, int $adminId)
    {
        $this->group = $group;
        $this->message = $message;
        $this->adminId = $adminId;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.notifications.' . $this->adminId)];
    }

    public function broadcastWith(): array
    {
        return [
            'group' => new GroupResource($this->group),
            'message' => $this->message,
        ];
    }
}
