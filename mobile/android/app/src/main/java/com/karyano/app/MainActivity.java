package com.karyano.app;

import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onStart() {
    super.onStart();
    // The layout is designed at 100% text size. Without this, a large system font / "display size" setting
    // inflates every label and makes the app look oversized on some phones. Smaller sizes are still respected.
    WebSettings settings = getBridge().getWebView().getSettings();
    if (settings.getTextZoom() > 100) settings.setTextZoom(100);
  }
}
