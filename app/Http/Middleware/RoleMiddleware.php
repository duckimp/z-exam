<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $roles
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Unauthorized.');
        }

        // Cek apakah user memiliki salah satu dari role yang diizinkan
        if (method_exists($user, 'hasAnyRole')) {
            if (!$user->hasAnyRole($roles)) {
                abort(403, 'Anda tidak memiliki hak akses untuk halaman ini.');
            }
        } else {
            // Fallback manual jika trait Spatie tidak terdeteksi
            $userRoles = method_exists($user, 'getRoleNames') ? $user->getRoleNames()->toArray() : [];
            $hasAccess = false;
            foreach ($roles as $role) {
                if (in_array($role, $userRoles)) {
                    $hasAccess = true;
                    break;
                }
            }
            if (!$hasAccess) {
                abort(453, 'Anda tidak memiliki hak akses untuk halaman ini.');
            }
        }

        return $next($request);
    }
}
