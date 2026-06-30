package com.alsalah.widgets

import android.app.PendingIntent
import android.app.AlarmManager
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.os.Build
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.icu.util.IslamicCalendar
import android.icu.util.TimeZone as IcuTimeZone
import android.widget.RemoteViews
import com.alsalah.MainActivity
import com.alsalah.R
import com.batoulapps.adhan.CalculationMethod
import com.batoulapps.adhan.Coordinates
import com.batoulapps.adhan.Madhab
import com.batoulapps.adhan.PrayerTimes
import com.batoulapps.adhan.data.DateComponents
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private const val LAHORE_LATITUDE = 31.502480
private const val LAHORE_LONGITUDE = 74.321451
private const val LOCATION_LABEL = "Lahore, PK"
private const val TIME_ZONE_ID = "Asia/Karachi"
private const val CUTOFF_HOUR = 2
private const val ONE_MINUTE_MS = 60_000L
private const val ACTION_REFRESH_SMALL = "com.alsalah.widgets.REFRESH_SMALL"
private const val ACTION_REFRESH_MEDIUM = "com.alsalah.widgets.REFRESH_MEDIUM"
private const val ACTION_REFRESH_LARGE = "com.alsalah.widgets.REFRESH_LARGE"

private val WIDGET_TIME_ZONE: TimeZone = TimeZone.getTimeZone(TIME_ZONE_ID)

enum class Namaz(
    val label: String,
    val icon: Int,
) {
    FAJR("Fajr", R.drawable.ic_namaz_fajr),
    DHUHR("Dhuhr", R.drawable.ic_namaz_dhuhr),
    ASR("Asr", R.drawable.ic_namaz_asr),
    MAGHRIB("Maghrib", R.drawable.ic_namaz_maghrib),
    ISHA("Isha", R.drawable.ic_namaz_isha),
}

data class NamazTime(
    val namaz: Namaz,
    val time: Date,
)

data class PrayerWidgetData(
    val now: Date,
    val current: NamazTime,
    val next: NamazTime,
    val timeline: List<NamazTime>,
    val currentIndex: Int,
)

abstract class PrayerWidgetProvider(
    private val layoutId: Int,
    private val rootViewId: Int,
    private val render: (Context, RemoteViews, PrayerWidgetData) -> Unit,
    private val providerClass: Class<out PrayerWidgetProvider>,
    private val refreshAction: String,
) : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        updateWidgets(context, appWidgetManager, appWidgetIds)
        scheduleNextRefresh(context, appWidgetIds)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        if (intent.action != refreshAction) {
            return
        }

        val appWidgetManager = AppWidgetManager.getInstance(context)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, providerClass),
        )

        if (appWidgetIds.isEmpty()) {
            cancelRefresh(context)
            return
        }

        updateWidgets(context, appWidgetManager, appWidgetIds)
        scheduleNextRefresh(context, appWidgetIds)
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)

        val remainingWidgetIds = AppWidgetManager.getInstance(context).getAppWidgetIds(
            ComponentName(context, providerClass),
        )

        if (remainingWidgetIds.isEmpty()) {
            cancelRefresh(context)
        }
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        cancelRefresh(context)
    }

    private fun updateWidgets(
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

    private fun scheduleNextRefresh(context: Context, appWidgetIds: IntArray) {
        if (appWidgetIds.isEmpty()) {
            return
        }

        val alarmManager = context.getSystemService(AlarmManager::class.java)
        val pendingIntent = createRefreshPendingIntent(
            context,
            PendingIntent.FLAG_UPDATE_CURRENT,
        ) ?: return
        val now = System.currentTimeMillis()
        val triggerAtMillis = ((now / ONE_MINUTE_MS) + 1) * ONE_MINUTE_MS + 50L

        scheduleMinuteAlarm(alarmManager, triggerAtMillis, pendingIntent)
    }

    private fun cancelRefresh(context: Context) {
        val alarmManager = context.getSystemService(AlarmManager::class.java)
        val pendingIntent = createRefreshPendingIntent(
            context,
            PendingIntent.FLAG_NO_CREATE,
        )

        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }

    private fun createRefreshPendingIntent(
        context: Context,
        flags: Int,
    ): PendingIntent? {
        val intent = Intent(context, providerClass).setAction(refreshAction)

        return PendingIntent.getBroadcast(
            context,
            layoutId,
            intent,
            flags or PendingIntent.FLAG_IMMUTABLE,
        )
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
        render(context, views, calculateWidgetData())

        return views
    }
}

class SmallPrayerWidgetProvider : PrayerWidgetProvider(
    R.layout.widget_prayer_small,
    R.id.widget_prayer_small_root,
    ::renderSmallWidget,
    SmallPrayerWidgetProvider::class.java,
    ACTION_REFRESH_SMALL,
)

class MediumPrayerWidgetProvider : PrayerWidgetProvider(
    R.layout.widget_prayer_medium,
    R.id.widget_prayer_medium_root,
    ::renderMediumWidget,
    MediumPrayerWidgetProvider::class.java,
    ACTION_REFRESH_MEDIUM,
)

class LargePrayerWidgetProvider : PrayerWidgetProvider(
    R.layout.widget_prayer_large,
    R.id.widget_prayer_large_root,
    ::renderLargeWidget,
    LargePrayerWidgetProvider::class.java,
    ACTION_REFRESH_LARGE,
)

private fun renderSmallWidget(
    context: Context,
    views: RemoteViews,
    data: PrayerWidgetData,
) {
    views.setTextViewText(R.id.widget_small_current_prayer, data.current.namaz.label)
    views.setTextViewText(R.id.widget_small_remaining, formatSmallRemaining(data))
    views.setTextViewText(R.id.widget_small_next, "Next: ${data.next.namaz.label}")
    views.setImageViewResource(R.id.widget_small_icon, data.current.namaz.icon)
    views.setProgressBar(R.id.widget_small_progress, 1_000, calculateIntervalProgress(data), false)
}

private fun renderMediumWidget(
    context: Context,
    views: RemoteViews,
    data: PrayerWidgetData,
) {
    val focusIndex = data.currentIndex
    val focusedItems = (-2..2).map { offset ->
        data.timeline[(focusIndex + offset).coerceIn(0, data.timeline.lastIndex)]
    }

    views.setTextViewText(R.id.widget_medium_time, formatTime(data.now))
    views.setTextViewText(R.id.widget_medium_status, "Next: ${data.next.namaz.label}")
    views.setTextViewText(R.id.widget_medium_place, LOCATION_LABEL)
    views.setTextViewText(R.id.widget_medium_hijri, formatHijriDate(data.now))

    setMediumInactiveSlot(
        views,
        R.id.widget_medium_slot_0_icon,
        R.id.widget_medium_slot_0_name,
        focusedItems[0],
    )
    setMediumInactiveSlot(
        views,
        R.id.widget_medium_slot_1_icon,
        R.id.widget_medium_slot_1_name,
        focusedItems[1],
    )
    views.setImageViewResource(R.id.widget_medium_focus_icon, data.current.namaz.icon)
    views.setTextViewText(R.id.widget_medium_focus_name, data.current.namaz.label)
    setMediumInactiveSlot(
        views,
        R.id.widget_medium_slot_3_icon,
        R.id.widget_medium_slot_3_name,
        focusedItems[3],
    )
    setMediumInactiveSlot(
        views,
        R.id.widget_medium_slot_4_icon,
        R.id.widget_medium_slot_4_name,
        focusedItems[4],
    )
}

private fun renderLargeWidget(
    context: Context,
    views: RemoteViews,
    data: PrayerWidgetData,
) {
    val previous = data.timeline[(data.currentIndex - 1).coerceAtLeast(0)]
    val firstNext = data.next
    val secondNext = data.timeline[(data.currentIndex + 2).coerceAtMost(data.timeline.lastIndex)]

    views.setTextViewText(R.id.widget_large_date, formatDisplayDate(data.now))
    views.setTextViewText(R.id.widget_large_time, formatTime(data.now))
    views.setTextViewText(R.id.widget_large_current_name, data.current.namaz.label)
    views.setTextViewText(R.id.widget_large_current_remaining, formatRemaining(data))
    views.setTextViewText(R.id.widget_large_current_time, formatTime(data.current.time))
    views.setImageViewResource(R.id.widget_large_current_icon, data.current.namaz.icon)

    setLargePrayerRow(
        views,
        R.id.widget_large_dhuhr_icon,
        R.id.widget_large_dhuhr_name,
        R.id.widget_large_dhuhr_time,
        previous,
    )
    setLargePrayerRow(
        views,
        R.id.widget_large_maghrib_icon,
        R.id.widget_large_maghrib_name,
        R.id.widget_large_maghrib_time,
        firstNext,
    )
    setLargePrayerRow(
        views,
        R.id.widget_large_isha_icon,
        R.id.widget_large_isha_name,
        R.id.widget_large_isha_time,
        secondNext,
    )
}

private fun setMediumInactiveSlot(
    views: RemoteViews,
    iconViewId: Int,
    labelViewId: Int,
    item: NamazTime,
) {
    views.setImageViewResource(iconViewId, item.namaz.icon)
    views.setTextViewText(labelViewId, item.namaz.label)
}

private fun setLargePrayerRow(
    views: RemoteViews,
    iconViewId: Int,
    labelViewId: Int,
    timeViewId: Int,
    item: NamazTime,
) {
    views.setImageViewResource(iconViewId, item.namaz.icon)
    views.setTextViewText(labelViewId, item.namaz.label)
    views.setTextViewText(timeViewId, formatTime(item.time))
}

private fun calculateWidgetData(now: Date = Date()): PrayerWidgetData {
    val trackingDate = getTrackingDate(now)
    val yesterday = addDays(trackingDate, -1)
    val tomorrow = addDays(trackingDate, 1)
    val sequence = listOf(prayerTimesForDate(yesterday).last()) +
        prayerTimesForDate(trackingDate) +
        prayerTimesForDate(tomorrow)
    val currentIndex = sequence.indexOfLast { !it.time.after(now) }
        .takeIf { it >= 0 }
        ?: 0
    val next = sequence.firstOrNull { it.time.after(now) }
        ?: sequence[(currentIndex + 1).coerceAtMost(sequence.lastIndex)]

    return PrayerWidgetData(
        now = now,
        current = sequence[currentIndex],
        next = next,
        timeline = sequence,
        currentIndex = currentIndex,
    )
}

private fun prayerTimesForDate(date: Date): List<NamazTime> {
    val params = CalculationMethod.KARACHI.getParameters()
    params.madhab = Madhab.HANAFI

    val prayerTimes = PrayerTimes(
        Coordinates(LAHORE_LATITUDE, LAHORE_LONGITUDE),
        dateComponents(date),
        params,
    )

    return listOf(
        NamazTime(Namaz.FAJR, truncateToMinute(prayerTimes.fajr)),
        NamazTime(Namaz.DHUHR, truncateToMinute(prayerTimes.dhuhr)),
        NamazTime(Namaz.ASR, truncateToMinute(prayerTimes.asr)),
        NamazTime(Namaz.MAGHRIB, truncateToMinute(prayerTimes.maghrib)),
        NamazTime(Namaz.ISHA, truncateToMinute(prayerTimes.isha)),
    )
}

private fun getTrackingDate(now: Date): Date {
    val calendar = Calendar.getInstance(WIDGET_TIME_ZONE)
    calendar.time = now

    if (calendar.get(Calendar.HOUR_OF_DAY) < CUTOFF_HOUR) {
        calendar.add(Calendar.DATE, -1)
    }

    calendar.set(Calendar.HOUR_OF_DAY, 12)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)

    return calendar.time
}

private fun addDays(date: Date, days: Int): Date {
    val calendar = Calendar.getInstance(WIDGET_TIME_ZONE)
    calendar.time = date
    calendar.add(Calendar.DATE, days)

    return calendar.time
}

private fun dateComponents(date: Date): DateComponents {
    val calendar = Calendar.getInstance(WIDGET_TIME_ZONE)
    calendar.time = date

    return DateComponents(
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH) + 1,
        calendar.get(Calendar.DAY_OF_MONTH),
    )
}

private fun truncateToMinute(date: Date): Date {
    val calendar = Calendar.getInstance(WIDGET_TIME_ZONE)
    calendar.time = date
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)

    return calendar.time
}

private fun formatTime(date: Date): String {
    return SimpleDateFormat("HH:mm", Locale.US).apply {
        timeZone = WIDGET_TIME_ZONE
    }.format(date)
}

private fun formatDisplayDate(date: Date): String {
    return SimpleDateFormat("EEEE, d MMM", Locale.US).apply {
        timeZone = WIDGET_TIME_ZONE
    }.format(date)
}

private fun formatHijriDate(date: Date): String {
    val calendar = IslamicCalendar(IcuTimeZone.getTimeZone(TIME_ZONE_ID), Locale.US)
    calendar.timeInMillis = date.time
    val monthNames = listOf(
        "Muharram",
        "Safar",
        "Rabi al-Awwal",
        "Rabi al-Thani",
        "Jumada al-Awwal",
        "Jumada al-Thani",
        "Rajab",
        "Sha'ban",
        "Ramadan",
        "Shawwal",
        "Dhu al-Qadah",
        "Dhu al-Hijjah",
    )
    val day = calendar.get(IslamicCalendar.DAY_OF_MONTH)
    val month = monthNames[calendar.get(IslamicCalendar.MONTH)]
    val year = calendar.get(IslamicCalendar.YEAR)

    return "$day $month $year"
}

private fun formatRemaining(data: PrayerWidgetData): String {
    return "In ${formatRemainingDuration(data)}"
}

private fun formatSmallRemaining(data: PrayerWidgetData): String {
    return "${formatRemainingDuration(data)} remaining"
}

private fun formatRemainingDuration(data: PrayerWidgetData): String {
    val remainingMillis = (data.next.time.time - data.now.time).coerceAtLeast(0)
    val totalMinutes = remainingMillis / 60_000
    val hours = totalMinutes / 60
    val minutes = totalMinutes % 60

    return when {
        hours > 0 -> "${hours}h ${minutes}m"
        else -> "${minutes}m"
    }
}

private fun calculateIntervalProgress(data: PrayerWidgetData): Int {
    val totalMillis = data.next.time.time - data.current.time.time

    if (totalMillis <= 0) {
        return 0
    }

    val elapsedMillis = (data.now.time - data.current.time.time).coerceIn(0, totalMillis)

    return ((elapsedMillis * 1_000) / totalMillis).toInt()
}

private fun scheduleMinuteAlarm(
    alarmManager: AlarmManager,
    triggerAtMillis: Long,
    pendingIntent: PendingIntent,
) {
    try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!alarmManager.canScheduleExactAlarms()) {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent,
                )
                return
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent,
            )
            return
        }

        alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
    } catch (_: SecurityException) {
        alarmManager.setAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            triggerAtMillis,
            pendingIntent,
        )
    }
}
