<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class ProductManagementController extends Controller
{
    /**
     * Display a listing of products
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search', '');
        $perPage = $request->query('per_page', 10);
        $categoryFilter = $request->query('category');

        $query = Product::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        if ($categoryFilter) {
            $query->where('category', $categoryFilter);
        }

        $products = $query->paginate($perPage)
            ->appends(request()->query());

        // Get unique categories
        $categories = Product::distinct()->pluck('category')->filter()->values();

        return Inertia::render('settings/products', [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'category' => $categoryFilter,
                'per_page' => $perPage,
            ],
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $filePath = null;

        if ($request->hasFile('image')) {
            $filePath = $this->storeProductImage($request->file('image'));
        }

        Product::create([
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'price' => (int)$validated['price'],
            'is_active' => $validated['is_active'] ?? true,
            'file_path' => $filePath,
        ]);

        return back()->with('success', 'Product berhasil ditambahkan');
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku,' . $product->id,
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $filePath = $product->file_path;

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->file_path) {
                $this->deleteProductImage($product->file_path);
            }
            $filePath = $this->storeProductImage($request->file('image'));
        }

        $product->update([
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'price' => (int)$validated['price'],
            'is_active' => $validated['is_active'] ?? true,
            'file_path' => $filePath,
        ]);

        return back()->with('success', 'Product berhasil diperbarui');
    }

    /**
     * Delete the specified product
     */
    public function destroy(Product $product)
    {
        // Delete image if exists
        if ($product->file_path) {
            $this->deleteProductImage($product->file_path);
        }

        $product->delete();

        return back()->with('success', 'Product berhasil dihapus');
    }

    /**
     * Store product image (already converted to WebP by frontend)
     */
    private function storeProductImage($image): ?string
    {
        try {
            $filename = Str::uuid() . '.webp';
            $path = 'products/' . $filename;
            $storagePath = storage_path('app/public/' . $path);

            // Ensure directory exists
            $directory = dirname($storagePath);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            // Simply move the file (already WebP from frontend)
            $image->move($directory, $filename);

            return $path;
        } catch (\Exception $e) {
            Log::error('Product image upload error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete product image
     */
    private function deleteProductImage(string $path): void
    {
        try {
            $storagePath = storage_path('app/public/' . $path);
            if (file_exists($storagePath)) {
                unlink($storagePath);
            }
        } catch (\Exception $e) {
            Log::error('Product image delete error: ' . $e->getMessage());
        }
    }
}
