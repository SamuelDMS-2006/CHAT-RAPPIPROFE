<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'avatar',
        'name',
        'email',
        'telefono',
        'email_verified_at',
        'group_asigned',
        'password',
        'is_admin',
        'is_asesor',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_users');
    }

    public static function getUsersExceptUser(User $user, $role = null)
    {
        $userId = $user->id;

        $query = User::select(['users.*', 'messages.message as last_message', 'messages.created_at as last_message_date'])
            ->when(!$user->is_admin, fn($q) => $q->whereNull('users.blocked_at'))
            ->when($role === 'admin', fn($q) => $q->where('is_admin', true))
            ->when($role === 'asesor', fn($q) => $q->where('is_asesor', true)->where('is_admin', false))
            ->when($role === 'usuario', fn($q) => $q->where('is_admin', false)->where('is_asesor', false))
            ->leftJoin('conversations', function ($join) use ($userId) {
                $join->on('conversations.user_id1', '=', 'users.id')
                    ->where('conversations.user_id2', '=', $userId)
                    ->orWhere(function ($query) use ($userId) {
                        $query->on('conversations.user_id2', '=', 'users.id')
                            ->where('conversations.user_id1', '=', $userId);
                    });
            })
            ->leftJoin('messages', 'messages.id', '=', 'conversations.last_message_id')
            ->orderByRaw('IFNULL(users.blocked_at, 1)')
            ->orderBy('messages.created_at', 'desc')
            ->orderBy('users.name');

        return $query->get();
    }


    public static function getAsesors(User $user)
    {
        return User::select(['users.*'])
            ->where('users.is_asesor', 1)
            ->when(!$user->is_admin, function ($query) {
                $query->whereNull('users.blocked_at');
            })
            ->orderBy('users.name')
            ->get();
    }


    public function toConversationArray()
    {
        return [
            'id' => $this->id,
            'avatar_url' => $this->avatar ? Storage::url($this->avatar) : null,
            'name' => $this->name,
            'is_group' => false,
            'is_user' => true,
            'is_admin' => (bool) $this->is_admin,
            'is_asesor' => (bool) $this->is_asesor,
            'group_asigned' => (int) $this->group_asigned,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'blocked_at' => $this->blocked_at,
            'last_message' => $this->last_message,
            'last_message_date' => $this->last_message_date ? ($this->last_message_date . ' UTC') : null,
        ];
    }
}
