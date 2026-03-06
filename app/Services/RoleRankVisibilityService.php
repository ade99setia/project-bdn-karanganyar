<?php

namespace App\Services;

use App\Models\User;

class RoleRankVisibilityService
{
    public function getUserRank(User $user): int
    {
        $user->unsetRelation('role');
        $user->load('role:id,rank');

        return (int) ($user->role?->rank ?? 0);
    }

    public function canViewLowerRanks(User $user): bool
    {
        return $this->getUserRank($user) > 0;
    }

    public function canViewTargetRank(User $viewer, ?int $targetRank, bool $includeSameRank = false): bool
    {
        $viewerRank = $this->getUserRank($viewer);
        $normalizedTargetRank = $targetRank ?? -1;

        if ($viewerRank <= 0) {
            return false;
        }

        if ($includeSameRank) {
            return $normalizedTargetRank <= $viewerRank;
        }

        return $normalizedTargetRank < $viewerRank;
    }
}
