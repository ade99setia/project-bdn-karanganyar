<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Struk - {{ $transaction->transaction_number }}</title>
    <style>
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .no-print {
                display: none;
            }
            @page {
                margin: 0;
            }
        }

        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.4;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
        }

        .center {
            text-align: center;
        }

        .bold {
            font-weight: bold;
        }

        .separator {
            border-top: 1px dashed #000;
            margin: 8px 0;
        }

        .double-separator {
            border-top: 2px solid #000;
            margin: 8px 0;
        }

        .item-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
        }

        .item-name {
            flex: 1;
        }

        .item-qty {
            width: 40px;
            text-align: center;
        }

        .item-price {
            width: 80px;
            text-align: right;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
        }

        .total-label {
            flex: 1;
        }

        .total-value {
            text-align: right;
            min-width: 100px;
        }

        .grand-total {
            font-size: 14px;
            font-weight: bold;
        }

        h2, h3 {
            margin: 5px 0;
        }

        p {
            margin: 3px 0;
        }

        .no-print {
            margin-top: 20px;
            text-align: center;
        }

        .print-button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 10px 20px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="center">
        <h2>{{ $storeName }}</h2>
        @if($storeAddress)
            <p>{{ $storeAddress }}</p>
        @endif
        @if($storePhone)
            <p>Telp: {{ $storePhone }}</p>
        @endif
    </div>

    <div class="double-separator"></div>

    <p><strong>No:</strong> {{ $transaction->transaction_number }}</p>
    <p><strong>Tanggal:</strong> {{ $transaction->created_at->format('d/m/Y H:i') }}</p>
    <p><strong>Kasir:</strong> {{ $transaction->cashier->name }}</p>
    @if($transaction->member)
        <p><strong>Member:</strong> {{ $transaction->member->name }} ({{ $transaction->member->member_number }})</p>
        <p><strong>Tier:</strong> {{ $transaction->member->membershipTier->name }}</p>
    @endif
    <p><strong>Cabang:</strong> {{ $transaction->warehouse->name }}</p>

    <div class="separator"></div>

    <div class="item-row bold">
        <div class="item-name">Item</div>
        <div class="item-qty">Qty</div>
        <div class="item-price">Total</div>
    </div>

    <div class="separator"></div>

    @foreach($transaction->items as $item)
        <div class="item-row">
            <div class="item-name">{{ $item->product->name }}</div>
            <div class="item-qty">{{ $item->quantity }}</div>
            <div class="item-price">{{ number_format($item->unit_price * $item->quantity, 0, ',', '.') }}</div>
        </div>
        @if($item->discount_percentage > 0)
            <div class="item-row" style="font-size: 10px; color: #666;">
                <div class="item-name">  Diskon {{ $item->discount_percentage }}%</div>
                <div class="item-qty"></div>
                <div class="item-price">-{{ number_format($item->discount_amount, 0, ',', '.') }}</div>
            </div>
        @endif
    @endforeach

    <div class="separator"></div>

    <div class="total-row">
        <div class="total-label">Subtotal:</div>
        <div class="total-value">Rp {{ number_format($transaction->subtotal, 0, ',', '.') }}</div>
    </div>

    @if($transaction->total_discount > 0)
        <div class="total-row">
            <div class="total-label">Total Diskon:</div>
            <div class="total-value">-Rp {{ number_format($transaction->total_discount, 0, ',', '.') }}</div>
        </div>
    @endif

    <div class="double-separator"></div>

    <div class="total-row grand-total">
        <div class="total-label">GRAND TOTAL:</div>
        <div class="total-value">Rp {{ number_format($transaction->grand_total, 0, ',', '.') }}</div>
    </div>

    <div class="double-separator"></div>

    <div class="total-row">
        <div class="total-label">Tunai:</div>
        <div class="total-value">Rp {{ number_format($transaction->cash_received, 0, ',', '.') }}</div>
    </div>

    <div class="total-row">
        <div class="total-label">Kembali:</div>
        <div class="total-value">Rp {{ number_format($transaction->cash_change, 0, ',', '.') }}</div>
    </div>

    <div class="separator"></div>

    <div class="center">
        <p><strong>Terima Kasih!</strong></p>
        <p>Belanja Lagi Ya 😊</p>
    </div>

    <div class="separator"></div>

    <div class="center" style="font-size: 10px;">
        <p>{{ $transaction->created_at->format('d/m/Y H:i:s') }}</p>
    </div>

    <div class="no-print">
        <button class="print-button" onclick="window.print()">Cetak Struk</button>
    </div>

    <script>
        // Auto print on load (optional)
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>
