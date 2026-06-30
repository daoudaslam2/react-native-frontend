package com.alsalah.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.alsalah.MainActivity
import com.alsalah.R

abstract class PrayerWidgetProvider(
    private val layoutId: Int,
    private val rootViewId: Int,
) : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        appWidgetIds.forEach { widgetId ->
            appWidgetManager.updateAppWidget(
                widgetId,
                createRemoteViews(context),
            )
        }
    }

    private fun createRemoteViews(context: Context): RemoteViews {
        val views = RemoteViews(context.packageName, layoutId)
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context,
            layoutId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        views.setOnClickPendingIntent(rootViewId, pendingIntent)

        return views
    }
}

class SmallPrayerWidgetProvider : PrayerWidgetProvider(
    R.layout.widget_prayer_small,
    R.id.widget_prayer_small_root,
)

class MediumPrayerWidgetProvider : PrayerWidgetProvider(
    R.layout.widget_prayer_medium,
    R.id.widget_prayer_medium_root,
)

class LargePrayerWidgetProvider : PrayerWidgetProvider(
    R.layout.widget_prayer_large,
    R.id.widget_prayer_large_root,
)
