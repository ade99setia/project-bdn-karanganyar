<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:membership_tiers,name',
            'default_discount_percentage' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string|max:500',
        ];
    }
}
