<?php

namespace Database\Seeders;

use Carbon\Carbon;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'telefono' => '3017584087',
            'password' => bcrypt('password'),
            'group_asigned' => 0,
            'is_admin' => true,
            'is_asesor' => true,
        ]);
        User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'telefono' => '3017584088',
            'password' => bcrypt('password'),
            'group_asigned' => 0,
            'is_asesor' => true,
        ]);
    }
}
