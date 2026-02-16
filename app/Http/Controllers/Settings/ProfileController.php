<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\FaceDescriptor;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $faceDescriptor = FaceDescriptor::where('user_id', $user->id)->first();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'faceDescriptor' => $faceDescriptor ? [
                'has_face' => true,
                'photo_path' => Storage::url($faceDescriptor->photo_path),
            ] : [
                'has_face' => false,
                'photo_path' => null,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Handle Face ID update.
     */
    public function updateFaceId(Request $request)
    {
        $request->validate([
            'data'  => 'required|string',
            'photo' => 'required|image|mimes:webp,png,jpg,jpeg|max:2048',
        ]);

        try {
            DB::beginTransaction();

            $user = $request->user();

            $faceData = json_decode($request->input('data'), true);

            if (!$faceData || !isset($faceData['descriptors'][0])) {
                throw new \Exception("Data descriptor tidak valid.");
            }

            $descriptorArray = $faceData['descriptors'][0];

            $photoPath = null;
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');

                $filename = 'face_' . $user->id . '_' . Str::random(10) . '.webp';

                $photoPath = $file->storeAs('faces', $filename, 'public');

                $existingFace = FaceDescriptor::where('user_id', $user->id)->first();
                if ($existingFace && $existingFace->photo_path) {
                    Storage::disk('public')->delete($existingFace->photo_path);
                }
            }

            FaceDescriptor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'descriptor' => json_encode($descriptorArray),
                    'photo_path' => $photoPath,
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data wajah dan foto berhasil diperbarui.',
                'photo_path' => $photoPath ? Storage::url($photoPath) : null
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            if (isset($photoPath)) {
                Storage::disk('public')->delete($photoPath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user's profile photo.
     */
    public function updateAvatar(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'photo' => 'required|image|mimes:webp,png,jpg,jpeg|max:2048',
        ]);

        try {
            DB::beginTransaction();

            $user = $request->user();

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $filename = 'profile_' . $user->id . '_' . Str::random(10) . '.webp';

                // Delete old photo if exists
                if ($user->avatar) {
                    Storage::disk('public')->delete('profiles/' . $user->avatar);
                }

                // Store new photo
                $photoPath = $file->storeAs('profiles', $filename, 'public');
                $user->avatar = $filename;
                $user->save();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Foto profil berhasil diperbarui.',
                    'photo_path' => Storage::url($photoPath),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'File tidak ditemukan',
            ], 400);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
