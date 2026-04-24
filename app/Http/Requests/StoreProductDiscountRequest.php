<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'membership_tier_id'  => 'required|exists:membership_tiers,id',
            'product_id'          => 'required|exists:products,id',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'is_active'           => 'boolean',
            'valid_from'          => 'nullable|date',
            'valid_until'         => 'nullable|date|after_or_equal:valid_from',
        ];
    }
}
