package com.example.appbagusdinamikanusantara;

import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DevMode")
public class DevModePlugin extends Plugin {

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            // Cek settingan Global Android: DEVELOPMENT_SETTINGS_ENABLED
            int devOptions = Settings.Global.getInt(
                getContext().getContentResolver(),
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 
                0
            );
            
            // Jika hasilnya 1, berarti Mode Pengembang AKTIF
            ret.put("enabled", devOptions == 1);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("enabled", false);
            call.resolve(ret);
        }
    }
}