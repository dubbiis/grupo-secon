<?php

namespace App\Policies;

use App\Models\Plan;
use App\Models\User;

class PlanPolicy
{
    public function view(User $user, Plan $plan): bool
    {
        return $user->id === $plan->user_id || $user->isAdmin();
    }

    public function delete(User $user, Plan $plan): bool
    {
        return $user->id === $plan->user_id || $user->isAdmin();
    }
}
