package com.alsalah.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = WidgetPinningModule.NAME)
class WidgetPinningModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun isPinningSupported(promise: Promise) {
        promise.resolve(isPinningSupported())
    }

    @ReactMethod
    fun requestPinWidget(widgetSize: String, promise: Promise) {
        if (!isPinningSupported()) {
            promise.resolve(false)
            return
        }

        val providerClass = when (widgetSize) {
            "small" -> SmallPrayerWidgetProvider::class.java
            "medium" -> MediumPrayerWidgetProvider::class.java
            "large" -> LargePrayerWidgetProvider::class.java
            else -> null
        }

        if (providerClass == null) {
            promise.reject("INVALID_WIDGET_SIZE", "Unsupported widget size: $widgetSize")
            return
        }

        try {
            val appWidgetManager = AppWidgetManager.getInstance(reactContext)
            val provider = ComponentName(reactContext, providerClass)
            val requestStarted = appWidgetManager.requestPinAppWidget(provider, null, null)

            promise.resolve(requestStarted)
        } catch (error: RuntimeException) {
            promise.reject("WIDGET_PIN_FAILED", error)
        }
    }

    @ReactMethod
    fun setIshaDeadlineMinutes(minutes: Double, promise: Promise) {
        try {
            setConfiguredIshaDeadlineMinutes(
                reactContext,
                minutes.toInt().coerceIn(0, MAX_ISHA_DEADLINE_MINUTES),
            )
            refreshPrayerWidgets(reactContext)
            promise.resolve(true)
        } catch (error: RuntimeException) {
            promise.reject("WIDGET_SETTING_FAILED", error)
        }
    }

    @ReactMethod
    fun clearIshaDeadlineMinutes(promise: Promise) {
        try {
            setConfiguredIshaDeadlineMinutes(reactContext, null)
            refreshPrayerWidgets(reactContext)
            promise.resolve(true)
        } catch (error: RuntimeException) {
            promise.reject("WIDGET_SETTING_FAILED", error)
        }
    }

    private fun isPinningSupported(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return false
        }

        return AppWidgetManager.getInstance(reactContext).isRequestPinAppWidgetSupported
    }

    companion object {
        const val NAME = "AlSalahWidgetPinning"
    }
}
