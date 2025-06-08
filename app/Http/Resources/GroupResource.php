<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'code_status' => (int) $this->code_status,
            'asesor' => (int) $this->asesor,
            'owner' => new UserResource($this->owner),
            'users' => UserResource::collection($this->users),
        ];
    }
}
