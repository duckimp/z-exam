<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StudentAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!session()->has('student_id')) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Sesi ujian tidak valid.'], 403);
            }
            return redirect()->route('student.login');
        }

        return $next($request);
    }
}
