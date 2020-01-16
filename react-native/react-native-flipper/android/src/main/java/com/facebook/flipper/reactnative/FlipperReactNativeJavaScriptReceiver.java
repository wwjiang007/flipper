/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.flipper.reactnative;

import com.facebook.flipper.core.FlipperObject;
import com.facebook.flipper.core.FlipperReceiver;
import com.facebook.flipper.core.FlipperResponder;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

public class FlipperReactNativeJavaScriptReceiver implements FlipperReceiver {
  String plugin;
  String method;
  FlipperReactNativeJavaScriptPluginManager manager;
  FlipperModule module;

  public FlipperReactNativeJavaScriptReceiver(
      FlipperReactNativeJavaScriptPluginManager manager,
      FlipperModule module,
      String plugin,
      String method) {
    this.plugin = plugin;
    this.method = method;
    this.manager = manager;
    this.module = module;
  }

  @Override
  public void onReceive(FlipperObject params, FlipperResponder responder) throws Exception {
    String responderId = manager.createResponderId(responder);
    WritableMap eventData = Arguments.createMap();
    eventData.putString("plugin", plugin);
    eventData.putString("method", method);
    eventData.putString("params", params.toJsonString());
    eventData.putString("responderId", responderId);
    module.sendJSEvent("react-native-flipper-receive-event", eventData);
  }
}
