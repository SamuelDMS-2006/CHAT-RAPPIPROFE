<?php

namespace App\Events;

use App\Http\Resources\GroupResource;
use App\Models\Group;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SocketGroups implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Group $group, public string $type)
    {
        //
    }


    public function broadcastWith(): array
    {
        return [
            'group' => new GroupResource($this->group),
            'type' => $this->type,
        ];
    }

    public function broadcastOn(): array
    {
        $m = $this->group;
        $channels = [];

        $channels[] = new PrivateChannel('message.group.' . $m->id);

        return $channels;
    }
}
