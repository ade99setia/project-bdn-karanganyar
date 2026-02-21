<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $roleId, string $status): Response
    {
        $user = $request->user();

        if (!$user || (int) $user->role_id !== (int) $roleId) {
            abort(403, 'Akses ditolak. Anda tidak memiliki peran yang sesuai untuk mengakses halaman ini. Silahkan hubungi admin untuk informasi lebih lanjut.');
        }

        $employee = $user->employee;

        if (!$employee || $employee->status !== $status) {
            abort(403, 'Status akun saat ini adalah ' . $employee->status . '. Silahkan hubungi admin untuk meminta diaktifkan kembali / untuk informasi lebih lanjut.');
        }

        return $next($request);
    }
}
