package com.alsalah.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent

internal const val WIDGET_SETTINGS_PREFS = "al_salah_widget_settings"
internal const val PREF_ISHA_DEADLINE_MINUTES = "isha_deadline_minutes"
internal const val PREF_PRAYER_LATITUDE = "prayer_latitude"
internal const val PREF_PRAYER_LONGITUDE = "prayer_longitude"
internal const val PREF_PRAYER_LOCATION_LABEL = "prayer_location_label"
internal const val PREF_PRAYER_TIME_ZONE = "prayer_time_zone"
internal const val PREF_USE_ADAPTIVE_WIDGET_COLORS = "use_adaptive_widget_colors"
internal const val UNSET_ISHA_DEADLINE_MINUTES = -1
internal const val MAX_ISHA_DEADLINE_MINUTES = 26 * 60
internal const val DEFAULT_PRAYER_LOCATION_LABEL = "Prayer location"
internal const val FALLBACK_PRAYER_TIME_ZONE = "UTC"
internal const val DEFAULT_USE_ADAPTIVE_WIDGET_COLORS = true
internal const val ACTION_REFRESH_SMALL = "com.alsalah.widgets.REFRESH_SMALL"
internal const val ACTION_REFRESH_AOD = "com.alsalah.widgets.REFRESH_AOD"
internal const val ACTION_REFRESH_AOD_LEFT = "com.alsalah.widgets.REFRESH_AOD_LEFT"
internal const val ACTION_REFRESH_MEDIUM = "com.alsalah.widgets.REFRESH_MEDIUM"
internal const val ACTION_REFRESH_LARGE = "com.alsalah.widgets.REFRESH_LARGE"

data class ConfiguredPrayerLocation(
    val latitude: Double,
    val longitude: Double,
    val label: String,
    val timeZone: String,
)

internal fun getConfiguredIshaDeadlineMinutes(context: Context): Int? {
    val minutes = context
        .getSharedPreferences(WIDGET_SETTINGS_PREFS, Context.MODE_PRIVATE)
        .getInt(PREF_ISHA_DEADLINE_MINUTES, UNSET_ISHA_DEADLINE_MINUTES)

    return minutes.takeIf { it != UNSET_ISHA_DEADLINE_MINUTES }
}

internal fun getConfiguredPrayerLocation(context: Context): ConfiguredPrayerLocation? {
    val prefs = context.getSharedPreferences(WIDGET_SETTINGS_PREFS, Context.MODE_PRIVATE)
    val latitude = prefs
        .getString(PREF_PRAYER_LATITUDE, null)
        ?.toDoubleOrNull()
        ?.takeIf { it in -90.0..90.0 }
        ?: return null
    val longitude = prefs
        .getString(PREF_PRAYER_LONGITUDE, null)
        ?.toDoubleOrNull()
        ?.takeIf { it in -180.0..180.0 }
        ?: return null
    val label = prefs
        .getString(PREF_PRAYER_LOCATION_LABEL, DEFAULT_PRAYER_LOCATION_LABEL)
        ?.takeIf { it.isNotBlank() }
        ?: DEFAULT_PRAYER_LOCATION_LABEL
    val timeZone = prefs
        .getString(PREF_PRAYER_TIME_ZONE, FALLBACK_PRAYER_TIME_ZONE)
        ?.takeIf { it.isNotBlank() }
        ?: FALLBACK_PRAYER_TIME_ZONE

    return ConfiguredPrayerLocation(
        latitude = latitude,
        longitude = longitude,
        label = label,
        timeZone = timeZone,
    )
}

internal fun getUseAdaptiveWidgetColors(context: Context): Boolean =
    context
        .getSharedPreferences(WIDGET_SETTINGS_PREFS, Context.MODE_PRIVATE)
        .getBoolean(
            PREF_USE_ADAPTIVE_WIDGET_COLORS,
            DEFAULT_USE_ADAPTIVE_WIDGET_COLORS,
        )

internal fun setConfiguredPrayerLocation(
    context: Context,
    latitude: Double,
    longitude: Double,
    label: String,
    timeZone: String,
) {
    context
        .getSharedPreferences(WIDGET_SETTINGS_PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(PREF_PRAYER_LATITUDE, latitude.coerceIn(-90.0, 90.0).toString())
        .putString(PREF_PRAYER_LONGITUDE, longitude.coerceIn(-180.0, 180.0).toString())
        .putString(PREF_PRAYER_LOCATION_LABEL, label.ifBlank { DEFAULT_PRAYER_LOCATION_LABEL })
        .putString(PREF_PRAYER_TIME_ZONE, timeZone.ifBlank { FALLBACK_PRAYER_TIME_ZONE })
        .apply()
}

internal fun clearConfiguredPrayerLocation(context: Context) {
    context
        .getSharedPreferences(WIDGET_SETTINGS_PREFS, Context.MODE_PRIVATE)
        .edit()
        .remove(PREF_PRAYER_LATITUDE)
        .remove(PREF_PRAYER_LONGITUDE)
        .remove(PREF_PRAYER_LOCATION_LABEL)
        .remove(PREF_PRAYER_TIME_ZONE)
        .apply()
}

internal fun setConfiguredIshaDeadlineMinutes(context: Context, minutes: Int?) {
    val editor = context
        .getSharedPreferences(WIDGET_SETTINGS_PREFS, Context.MODE_PRIVATE)
        .edit()

    if (minutes == null) {
        editor.remove(PREF_ISHA_DEADLINE_MINUTES)
    } else {
        editor.putInt(
            PREF_ISHA_DEADLINE_MINUTES,
            minutes.coerceIn(0, MAX_ISHA_DEADLINE_MINUTES),
        )
    }

    editor.apply()
}

internal fun setUseAdaptiveWidgetColors(context: Context, enabled: Boolean) {
    context
        .getSharedPreferences(WIDGET_SETTINGS_PREFS, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(PREF_USE_ADAPTIVE_WIDGET_COLORS, enabled)
        .apply()
}

internal fun refreshPrayerWidgets(context: Context) {
    val providers = listOf(
        SmallPrayerWidgetProvider::class.java to ACTION_REFRESH_SMALL,
        AodPrayerWidgetProvider::class.java to ACTION_REFRESH_AOD,
        AodLeftPrayerWidgetProvider::class.java to ACTION_REFRESH_AOD_LEFT,
        MediumPrayerWidgetProvider::class.java to ACTION_REFRESH_MEDIUM,
        LargePrayerWidgetProvider::class.java to ACTION_REFRESH_LARGE,
    )
    val appWidgetManager = AppWidgetManager.getInstance(context)

    providers.forEach { (providerClass, action) ->
        val ids = appWidgetManager.getAppWidgetIds(
            ComponentName(context, providerClass),
        )

        if (ids.isNotEmpty()) {
            context.sendBroadcast(Intent(context, providerClass).setAction(action))
        }
    }
}
