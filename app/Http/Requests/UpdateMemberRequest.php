<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'member_number' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('members', 'member_number')->ignore($this->route('member'))
            ],
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'membership_tier_id' => 'nullable|exists:membership_tiers,id',
            'is_active' => 'nullable|boolean',
        ];
    }
}
