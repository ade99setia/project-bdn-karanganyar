<?php

namespace App\Http\Requests;

use App\Services\POSService;
use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cart_items' => 'required|array|min:1',
            'cart_items.*.product_id' => 'required|exists:products,id',
            'cart_items.*.quantity' => 'required|integer|min:1',
            'cart_items.*.unit_price' => 'required|numeric|min:0',
            'member_id' => 'nullable|exists:members,id',
            'cash_received' => 'required|numeric|min:0',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $posService = app(POSService::class);
            $warehouseId = auth()->user()->warehouse_id;

            // Validate stock availability for each item
            foreach ($this->cart_items as $index => $item) {
                $availableStock = $posService->getAvailableStock($item['product_id'], $warehouseId);
                
                if ($item['quantity'] > $availableStock) {
                    $validator->errors()->add(
                        "cart_items.{$index}.quantity",
                        "Stok tidak mencukupi. Stok tersedia: {$availableStock}"
                    );
                }
            }

            // Validate cash received (will be checked against grand_total in controller)
        });
    }
}
