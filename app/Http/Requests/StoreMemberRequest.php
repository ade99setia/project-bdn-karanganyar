<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'member_number' => 'nullable|string|max:50|unique:members,member_number',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'membership_tier_id' => 'required|exists:membership_tiers,id',
        ];
    }
}
