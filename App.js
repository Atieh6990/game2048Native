/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useEffect, useState, useCallback } from "react";
import type { Node } from "react";
import {
  StyleSheet, BackHandler, Platform, Linking, Alert, PermissionsAndroid, TVEventHandler, I18nManager,
} from "react-native";

import { WebView } from "react-native-webview";
import Spinner from "react-native-loading-spinner-overlay";
import DeviceInfo from "react-native-device-info";
import RNExitApp from "react-native-exit-app";
import SharedGroupPreferences from "react-native-shared-group-preferences";
import { getMacLanAddress } from "react-native-device-info/src/index";

let webview = {};
let _tvEventHandler: any;

const App = () => {
    const appGroupIdentifier = "group.com.hamsam.sam";
    let player = {};

    const [ref, setRef] = useState(true);
    const [spinner, setSpinner] = useState(true);
    const [userData, setUserData] = useState({});
    const [macAddress, setMacAddress] = useState("");
    const [macLan, setMacLan] = useState("");
    const [videoShow, setVideoShow] = useState(false);
    const [playerUrl, setPlayerUrl] = useState("");
    const [posterUrl, setPosterUrl] = useState("");
    const [rateVideo, setRateVideo] = useState(1.0);
    const [isFull, setIsFull] = useState(false);
    const [uid, setUid] = useState("");
    const [tvType, setTvType] = useState(1);
    const [web, setWeb] = useState(1.0);

    const _enableTVEventHandler = () => {
      _tvEventHandler = new TVEventHandler();
      _tvEventHandler.enable(this, function(cmp, evt) {
        console.log(evt);
        if (evt.eventType === "right") {
        } else if (evt.eventType === "up") {
        } else if (evt.eventType === "left") {
        } else if (evt.eventType === "down") {
        } else if (evt.eventType === "playPause") {
        }
      });
    };



    useEffect(() => {
      setTimeout(() => {
        // _enableTVEventHandler();
        getMacId();
        getMacLan();
        if (Platform.OS === "android") {
          BackHandler.addEventListener("hardwareBackPress", onAndroidBackPress);
          dealWithPermissions();
        }
        return () => {
          if (Platform.OS === "android") {
            BackHandler.removeEventListener("hardwareBackPress");
          }
        };
      }, 10);
    }, []);


    const getMacLan = () => {
      // alert("getMacLanAddress");
      DeviceInfo.getMacLanAddress().then((result) => {
        // console.log("getMacLan --> " + result);
        setMacLan(result);
      })
        .catch((error) => console.warn("getMac: no", error));
    };

    const getMacId = () => {
      // alert("getMacAddress");
      DeviceInfo.getMacAddress().then((mac) => {
        // console.log("mCac --> " + mac);
        setMacAddress(mac);
      })
        .catch((error) => alert("getMacAddress: no" + error));
    };


    const onAndroidBackPress = () => {
      //console.log(JSON.stringify(this.webView))
      //this.webView.ref.goBack();
      //return true;

      //webview.ref.goBack();
      //console.log(webview.ref)

      // webview.ref.injectJavaScript( "controller.$data.activePage =5" );
      //  webview.ref.injectJavaScript( "var evt = new KeyboardEvent('eventali', {'keyCode':1, 'which':10009});window.dispatchEvent (evt);" );
      //  webview.ref.injectJavaScript( "var evt = new KeyboardEvent('keydown', {'keyCode':1, 'which':10009});window.dispatchEvent (evt);" );

      //webview.ref.injectJavaScript('controller.handleBack()');
      //return true;
      let params = { type: "returnPage", data: "" };
      const param = JSON.stringify(params);
      if (webview.ref) {
        // console.log("backe app.js");
        //webview.ref.injectJavaScript( 'window.controller.$emit("PostMessages", '+param+')' );
        //webview.ref.goBack();
        // webview.ref.injectJavaScript("handleBack()");
        webview.ref.injectJavaScript("window.app1.$emit(\"PostMessages\", " + param + ")");

        return true;
      }
      return false;
    };

    const sendDataInWebView = (type, data, calltype = "") => {
      // console.log("///////webviewRef = ", type, data, webview.ref);
      //alert('step3')

      let params = { type: type, data: data };
      const param = JSON.stringify(params);
      // console.log("param", param);

      if (webview.ref) {
        if (calltype != "") {
          if (JSON.parse(calltype).fromOnlineJs == 1) {
            webview.ref.injectJavaScript("infoSsn.loginUserData(" + param + ")");
            return false;
          }

        } else {
          webview.ref.injectJavaScript("window.app1.$emit(\"PostMessages\", " + param + ")");
        }
      }
    };

    const playVideo = (data) => {
      // alert(data);
      // alert("play video -> " + data.video);
      // alert("play poster -> " + data.poster);
      setPlayerUrl(data.video);
      setPosterUrl(data.poster);
      setVideoShow(true);
    };

    const loadAppData = () => {

      let sendData = {
        ver: DeviceInfo.getSystemVersion(),
        packageName: DeviceInfo.getBundleId(),
        model: DeviceInfo.getModel(),
        androidId: DeviceInfo.getUniqueId(),
      };
      let params = {
        type: "appData", data: JSON.stringify(sendData),
      };
      const param = JSON.stringify(params);
      webview.ref.injectJavaScript("infoSsn.appData(" + param + ")");
    };

    const loadUserDataFromSharedStorage = async (data) => {
      try {
        const loadedData = await SharedGroupPreferences.getItem(
          "savedData",
          appGroupIdentifier,
        );
        console.log("loadedData", loadedData);
        sendDataInWebView("userData", loadedData, data);

      } catch (errorCode) {

        console.log("errorCode" + errorCode);
        sendDataInWebView("userData", "null", data);

      }
    };

    const saveUserDataToSharedStorage = async (data) => {
      try {
        const grantedStatus = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);
        const writeGranted = grantedStatus["android.permission.WRITE_EXTERNAL_STORAGE"] === PermissionsAndroid.RESULTS.GRANTED;
        const readGranted = grantedStatus["android.permission.READ_EXTERNAL_STORAGE"] === PermissionsAndroid.RESULTS.GRANTED;
        if (writeGranted && readGranted) {
          await SharedGroupPreferences.setItem("savedData", data, appGroupIdentifier);

          sendDataInWebView("setTokenSuccess", "{}");
        } else {
          sendDataInWebView("setTokenError", "{}");
        }
      } catch (errorCode) {
        //sendDataInWebView('setTokenError',{errorCode});
        //console.log(errorCode)
      }
    };

  const dealWithPermissions = async () => {
    try {
      const grantedStatus = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
      const writeGranted =
        grantedStatus['android.permission.WRITE_EXTERNAL_STORAGE'] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const readGranted =
        grantedStatus['android.permission.READ_EXTERNAL_STORAGE'] ===
        PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
    }
  };

    const handlePress = async (url) => {
      // Checking if the link is supported for links with custom URL scheme.
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        // Opening the link with some app, if the URL scheme is "http" the web link should be opened
        // by some browser in the mobile
        await Linking.openURL(url);
      } else {
        Alert.alert(`Don't know how to open this URL: ${url}`);
      }
    };

    const handleOnMessage = (event) => {
      const { type, data } = JSON.parse(event.nativeEvent.data);
      // alert('ver-->' + DeviceInfo.getSystemVersion() + 'packageName-->' + DeviceInfo.getBundleId() + 'model-->' + DeviceInfo.getModel() + 'androidId-->' + DeviceInfo.getUniqueId())
      // {ver:DeviceInfo.getSystemVersion(),packageName:DeviceInfo.getBundleId(),model:DeviceInfo.getModel(),androidId:DeviceInfo.getUniqueId()};
      // console.log('han
      // dleOnMessage type ===>  ' , JSON.parse(event.nativeEvent.data));
      console.log("handleOnMessage data ===>  ", data, type);
      switch (type) {
        case "browser":
          handlePress(data);
          break;
        case "setToken":
          saveUserDataToSharedStorage(data);
          break;
        case "getToken":
          loadUserDataFromSharedStorage(data);
          break;
        case "getPkgName":
          loadAppData();
          break;
        case "exit":
          RNExitApp.exitApp();
          break;
      }
    };

    const onBuffer = () => {
      console.log("onBuffer");
    };


    const renderWebview = () => {
      return (

        <WebView
          onLoadEnd={() => setSpinner(false)}
          onMessage={handleOnMessage}
          originWhitelist={["*"]}
          useWebKit={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          mediaPlaybackRequiresUserAction={false}
          // source={{
          //   uri:
          //     "file:///android_asset/index.html?mac_lan=" + new Date().getTime(),
          // }}
          source={{
            uri:
              "file:///android_asset/index.html?mac=" +
              macAddress +
              "&ver=" +
              DeviceInfo.getSystemVersion() +
              "&package_name=" +
              DeviceInfo.getBundleId() +
              "&model=" +
              DeviceInfo.getBuildNumber() +
              "&android_id=" +
              DeviceInfo.getUniqueId() +
              "&mac_lan=" +
              macLan +
              "&t=" +
              new Date().getTime(),
          }}
          //         source={ { uri : "http://samyar.rasgames.ir/varzesh3/android/index.html?t="+new Date().getTime()}}
          // source={{ uri: "https://www.varzesh3.com/" }}
          ref={(ref) => {
            webview.ref = ref;
          }}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          sharedCookiesEnabled={true}
          onNavigationStateChange={(navState) => {
            webview.canGoBack = navState.canGoBack;
          }}

          onError={syntheticEvent => {
            console.log("error dare ", syntheticEvent);
          }}
        />

      );
    };


    return (<>
      <Spinner
        visible={spinner}
        textContent={""}
        textStyle={{ color: "#000000" }}
      />
      {renderWebview()}
    </>);
  }
;

export default App;
