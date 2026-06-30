package com.alsalah.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent

internal const val WIDGET_SETTINGS_PREFS = "al_salah_widget_settings"
internal const val PREF_ISHA_DEADLINE_MINUTES = "isha_deadline_minutes"
internal const val UNSET_ISHA_DEADLINE_MINUTES = -1
internal const val MAX_ISHA_DEADLINE_MINUTES = 26 * 60
internal const val ACTION_REFRESH_SMALL = "com.alsalah.widgets.REFRESH_SMALL"
internal const val ACTION_REFRESH_MEDIUM = "com.alsalah.widgets.REFRESH_MEDIUM"
internal const val ACTION_REFRESH_LARGE = "com.alsalah.widgets.REFRESH_LARGE"

internal fun getConfiguredIshaDeadlineMinutes(context: Context): Int? {
    val minutes = context
        .getSharedPreferences(WIDGET_SETTINGS_PREFS, Context.MODE_PRIVATE)
        .getInt(PREF_ISHA_DEADLINE_MINUTES, UNSET_ISHA_DEADLINE_MINUTES)

    return minutes.takeIf { it != UNSET_ISHA_DEADLINE_MINUTES }
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

internal fun refreshPrayerWidgets(context: Context) {
    val providers = listOf(
        SmallPrayerWidgetProvider::class.java to ACTION_REFRESH_SMALL,
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
