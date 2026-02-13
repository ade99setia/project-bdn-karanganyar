package com.example.appbagusdinamikanusantara;

import android.os.Bundle; // <-- Pastikan ada ini
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // --- TAMBAHKAN BARIS INI ---
        registerPlugin(DevModePlugin.class);
        // ---------------------------
        
        super.onCreate(savedInstanceState);
    }
}