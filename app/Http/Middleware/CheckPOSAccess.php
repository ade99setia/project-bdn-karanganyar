<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPOSAccess
{
    /**
     * Handle an incoming request.
     * 
     * Allows access to POS for users with roles: kasir, admin, supervisor
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Anda harus login terlebih dahulu');
        }

        // Load role relationship if not loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }

        // Check if user has allowed role
        $allowedRoles = ['kasir', 'admin', 'supervisor'];
        $userRoleName = $user->role?->name;
        
        if (!$userRoleName || !in_array($userRoleName, $allowedRoles)) {
            abort(403, 'Akses ditolak. Hanya kasir, admin, dan supervisor yang dapat mengakses POS.');
        }

        // For kasir role, check if warehouse is assigned
        if ($userRoleName === 'kasir' && !$user->warehouse_id) {
            abort(403, 'Anda belum ditugaskan ke cabang manapun. Silakan hubungi admin.');
        }

        return $next($request);
    }
}
