package com.alsalah.widgets

import android.app.PendingIntent
import android.app.AlarmManager
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.os.Build
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.content.res.Resources
import android.icu.util.IslamicCalendar
import android.icu.util.TimeZone as IcuTimeZone
import android.util.TypedValue
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

private const val ONE_MINUTE_MS = 60_000L

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

data class DayPrayerTimes(
    val fajr: Date,
    val sunrise: Date,
    val dhuhr: Date,
    val asr: Date,
    val maghrib: Date,
    val isha: Date,
)

data class NamazWindow(
    val namaz: Namaz,
    val start: Date,
    val end: Date,
)

data class PrayerWidgetData(
    val now: Date,
    val current: NamazTime,
    val next: NamazTime,
    val timeline: List<NamazTime>,
    val currentIndex: Int,
    val isPrayerActive: Boolean,
    val countdownStart: Date,
    val countdownEnd: Date,
    val location: ConfiguredPrayerLocation,
)

abstract class PrayerWidgetProvider(
    private val layoutId: Int,
    private val rootViewId: Int,
    private val render: (Context, RemoteViews, PrayerWidgetData?) -> Unit,
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
        render(context, views, calculateWidgetData(context))

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

class AodPrayerWidgetProvider : PrayerWidgetProvider(
    R.layout.widget_prayer_aod,
    R.id.widget_prayer_aod_root,
    ::renderAodWidget,
    AodPrayerWidgetProvider::class.java,
    ACTION_REFRESH_AOD,
)

class AodLeftPrayerWidgetProvider : PrayerWidgetProvider(
    R.layout.widget_prayer_aod_left,
    R.id.widget_prayer_aod_root,
    ::renderAodWidget,
    AodLeftPrayerWidgetProvider::class.java,
    ACTION_REFRESH_AOD_LEFT,
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
    data: PrayerWidgetData?,
) {
    if (data == null) {
        renderSmallSetupWidget(context, views)
        return
    }

    val currentLabel = data.current.namaz.label
    applySmallWidgetTheme(context, views)
    views.setTextViewText(R.id.widget_small_current_prayer, currentLabel)
    views.setTextViewTextSize(
        R.id.widget_small_current_prayer,
        TypedValue.COMPLEX_UNIT_SP,
        getSmallWidgetTitleSize(currentLabel),
    )
    views.setTextViewText(R.id.widget_small_remaining, formatSmallRemaining(data))
    views.setTextViewText(R.id.widget_small_next, formatSmallFooter(data))
    views.setImageViewResource(R.id.widget_small_icon, data.current.namaz.icon)
    views.setProgressBar(R.id.widget_small_progress, 1_000, calculateIntervalProgress(data), false)
}

private fun renderSmallSetupWidget(context: Context, views: RemoteViews) {
    applySmallWidgetTheme(context, views)
    views.setTextViewText(R.id.widget_small_current_prayer, "Set location")
    views.setTextViewTextSize(
        R.id.widget_small_current_prayer,
        TypedValue.COMPLEX_UNIT_SP,
        16f,
    )
    views.setTextViewText(R.id.widget_small_remaining, "Open Al-Salah")
    views.setTextViewText(R.id.widget_small_next, "Choose coordinates")
    views.setImageViewResource(R.id.widget_small_icon, R.drawable.ic_namaz_fajr)
    views.setProgressBar(R.id.widget_small_progress, 1_000, 0, false)
}

private fun renderAodWidget(
    context: Context,
    views: RemoteViews,
    data: PrayerWidgetData?,
) {
    if (data == null) {
        renderAodSetupWidget(views)
        return
    }

    val currentLabel = data.current.namaz.label
    views.setTextViewText(R.id.widget_aod_current_prayer, currentLabel)
    views.setTextViewTextSize(
        R.id.widget_aod_current_prayer,
        TypedValue.COMPLEX_UNIT_SP,
        getAodWidgetTitleSize(currentLabel),
    )
    views.setTextViewText(R.id.widget_aod_remaining, formatAodRemaining(data))
    views.setTextViewText(R.id.widget_aod_next, formatSmallFooter(data))
    views.setImageViewResource(R.id.widget_aod_icon, data.current.namaz.icon)
    views.setProgressBar(R.id.widget_aod_progress, 1_000, calculateIntervalProgress(data), false)
}

private fun renderAodSetupWidget(views: RemoteViews) {
    views.setTextViewText(R.id.widget_aod_current_prayer, "Set location")
    views.setTextViewTextSize(
        R.id.widget_aod_current_prayer,
        TypedValue.COMPLEX_UNIT_SP,
        16f,
    )
    views.setTextViewText(R.id.widget_aod_remaining, "Open Al-Salah")
    views.setTextViewText(R.id.widget_aod_next, "Choose coordinates")
    views.setImageViewResource(R.id.widget_aod_icon, R.drawable.ic_namaz_fajr)
    views.setProgressBar(R.id.widget_aod_progress, 1_000, 0, false)
}

private fun getSmallWidgetTitleSize(label: String): Float = when {
    label.length >= 7 -> 16f
    label.length >= 5 -> 20f
    else -> 23f
}

private fun getAodWidgetTitleSize(label: String): Float = when {
    label.length >= 7 -> 15f
    label.length >= 5 -> 18f
    else -> 20f
}

private data class WidgetPalette(
    val isDark: Boolean,
    val card: Int,
    val cardSoft: Int,
    val accent: Int,
    val accentContainer: Int,
    val iconForeground: Int,
    val text: Int,
    val muted: Int,
    val inactive: Int,
    val track: Int,
    val ring: Int,
)

private fun applySmallWidgetTheme(context: Context, views: RemoteViews) {
    val palette = getWidgetPalette(context)

    views.setInt(
        R.id.widget_prayer_small_root,
        "setBackgroundResource",
        if (palette.isDark) R.drawable.widget_small_card_bg_dark else R.drawable.widget_small_card_bg,
    )
    tintBackground(views, R.id.widget_prayer_small_root, palette.card)
    views.setInt(R.id.widget_small_ring, "setColorFilter", palette.ring)
    views.setTextColor(R.id.widget_small_current_prayer, palette.text)
    views.setTextColor(R.id.widget_small_remaining, palette.accent)
    views.setTextColor(R.id.widget_small_next, palette.muted)
    tintBackground(views, R.id.widget_small_icon_bg, palette.accentContainer)
    setImageTint(views, R.id.widget_small_icon, palette.iconForeground)
    tintProgress(views, R.id.widget_small_progress, palette.accent)
    tintProgressTrack(views, R.id.widget_small_progress, palette.track)
}

private fun applyMediumWidgetTheme(context: Context, views: RemoteViews) {
    val palette = getWidgetPalette(context)

    views.setInt(
        R.id.widget_prayer_medium_root,
        "setBackgroundResource",
        if (palette.isDark) R.drawable.widget_card_bg_dark else R.drawable.widget_card_bg,
    )
    tintBackground(views, R.id.widget_prayer_medium_root, palette.card)
    tintBackground(views, R.id.widget_medium_ring, palette.ring)
    views.setTextColor(R.id.widget_medium_time, palette.text)
    views.setTextColor(R.id.widget_medium_status, palette.accent)
    views.setTextColor(R.id.widget_medium_place, palette.muted)
    views.setTextColor(R.id.widget_medium_hijri, palette.muted)
    views.setTextColor(R.id.widget_medium_focus_name, palette.accent)
    tintBackground(views, R.id.widget_medium_focus_bg, palette.accentContainer)
    setImageTint(views, R.id.widget_medium_focus_icon, palette.iconForeground)
    setImageTint(views, R.id.widget_medium_slot_0_icon, palette.inactive)
    setImageTint(views, R.id.widget_medium_slot_1_icon, palette.inactive)
    setImageTint(views, R.id.widget_medium_slot_3_icon, palette.inactive)
    setImageTint(views, R.id.widget_medium_slot_4_icon, palette.inactive)
    views.setTextColor(R.id.widget_medium_slot_0_name, palette.inactive)
    views.setTextColor(R.id.widget_medium_slot_1_name, palette.inactive)
    views.setTextColor(R.id.widget_medium_slot_3_name, palette.inactive)
    views.setTextColor(R.id.widget_medium_slot_4_name, palette.inactive)
}

private fun applyLargeWidgetTheme(context: Context, views: RemoteViews) {
    val palette = getWidgetPalette(context)

    views.setInt(
        R.id.widget_prayer_large_root,
        "setBackgroundResource",
        if (palette.isDark) R.drawable.widget_card_bg_dark else R.drawable.widget_card_bg,
    )
    tintBackground(views, R.id.widget_prayer_large_root, palette.card)
    views.setInt(
        R.id.widget_large_current_row,
        "setBackgroundResource",
        if (palette.isDark) R.drawable.widget_card_current_bg_dark else R.drawable.widget_card_current_bg,
    )
    tintBackground(views, R.id.widget_large_current_row, palette.cardSoft)
    views.setInt(
        R.id.widget_large_more,
        "setBackgroundResource",
        if (palette.isDark) R.drawable.widget_more_circle_dark else R.drawable.widget_more_circle,
    )
    tintBackground(views, R.id.widget_large_more, palette.track)
    views.setInt(
        R.id.widget_large_row_divider,
        "setBackgroundResource",
        if (palette.isDark) R.drawable.widget_row_divider_dark else R.drawable.widget_row_divider,
    )
    tintBackground(views, R.id.widget_large_row_divider, palette.muted)
    tintBackground(views, R.id.widget_large_ring_solid, palette.ring)
    tintBackground(views, R.id.widget_large_ring_dotted, palette.ring)
    views.setTextColor(R.id.widget_large_date, palette.muted)
    views.setTextColor(R.id.widget_large_time, palette.text)
    views.setTextColor(R.id.widget_large_more, palette.muted)
    views.setTextColor(R.id.widget_large_current_name, palette.text)
    views.setTextColor(R.id.widget_large_current_remaining, palette.accent)
    views.setTextColor(R.id.widget_large_current_time, palette.text)
    tintBackground(views, R.id.widget_large_current_icon_bg, palette.accentContainer)
    setImageTint(views, R.id.widget_large_current_icon, palette.iconForeground)
    tintBackground(views, R.id.widget_large_current_accent, palette.accent)
    setLargeInactiveColors(views, R.id.widget_large_dhuhr_icon, R.id.widget_large_dhuhr_name, R.id.widget_large_dhuhr_time, palette)
    setLargeDefaultColors(views, R.id.widget_large_maghrib_icon, R.id.widget_large_maghrib_name, R.id.widget_large_maghrib_time, palette)
    setLargeDefaultColors(views, R.id.widget_large_isha_icon, R.id.widget_large_isha_name, R.id.widget_large_isha_time, palette)
}

private fun getWidgetPalette(context: Context): WidgetPalette {
    val isDark = getUseDarkWidgetTheme(context)
    val usesDynamicColors = isUsingDynamicWidgetColors(context)
    val defaultCard = context.getColor(if (isDark) R.color.widget_dark_card else R.color.widget_card)
    val defaultCardSoft = context.getColor(if (isDark) R.color.widget_dark_card_soft else R.color.widget_card_soft)
    val defaultAccent = context.getColor(
        if (isDark) R.color.widget_dark_primary else R.color.widget_primary,
    )
    val defaultAccentContainer = context.getColor(
        if (isDark) R.color.widget_dark_primary_container else R.color.widget_primary,
    )
    val accent = getDynamicWidgetColor(
        context,
        if (isDark) android.R.color.system_accent1_300 else android.R.color.system_accent1_600,
        defaultAccent,
    )
    val adaptiveAccentContainer = getDynamicWidgetColor(
        context,
        android.R.color.system_accent1_600,
        defaultAccentContainer,
    )
    val card = if (isDark) {
        getDynamicWidgetColor(context, android.R.color.system_accent2_800, defaultCard)
    } else {
        defaultCard
    }

    return WidgetPalette(
        isDark = isDark,
        card = card,
        cardSoft = if (isDark) {
            getDynamicWidgetColor(context, android.R.color.system_neutral2_900, defaultCardSoft)
        } else {
            defaultCardSoft
        },
        accent = accent,
        accentContainer = if (isDark && usesDynamicColors) {
            card
        } else {
            adaptiveAccentContainer
        },
        iconForeground = if (isDark && usesDynamicColors) {
            accent
        } else {
            context.getColor(android.R.color.white)
        },
        text = context.getColor(if (isDark) R.color.widget_dark_text else R.color.widget_text),
        muted = context.getColor(if (isDark) R.color.widget_dark_muted else R.color.widget_muted),
        inactive = context.getColor(if (isDark) R.color.widget_dark_inactive else R.color.widget_inactive),
        track = if (isDark) {
            getDynamicWidgetColorFromResource(context, android.R.color.system_neutral2_700, R.color.widget_dark_track)
        } else {
            context.getColor(R.color.widget_track)
        },
        ring = if (isDark) {
            getDynamicWidgetColorFromResource(context, android.R.color.system_accent2_700, R.color.widget_dark_ring)
        } else {
            context.getColor(R.color.widget_ring)
        },
    )
}

private fun isUsingDynamicWidgetColors(context: Context): Boolean =
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && getUseAdaptiveWidgetColors(context)

private fun getDynamicWidgetColorFromResource(context: Context, colorResourceId: Int, fallbackColorResourceId: Int): Int =
    getDynamicWidgetColor(context, colorResourceId, context.getColor(fallbackColorResourceId))

private fun getDynamicWidgetColor(context: Context, colorResourceId: Int, fallback: Int): Int {
    if (!isUsingDynamicWidgetColors(context)) {
        return fallback
    }

    return try {
        context.getColor(colorResourceId)
    } catch (_: Resources.NotFoundException) {
        fallback
    }
}

private fun tintBackground(views: RemoteViews, viewId: Int, color: Int) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return
    }

    views.setColorStateList(
        viewId,
        "setBackgroundTintList",
        ColorStateList.valueOf(color),
    )
}

private fun setImageTint(views: RemoteViews, viewId: Int, color: Int) {
    views.setInt(viewId, "setColorFilter", color)
}

private fun tintProgress(views: RemoteViews, viewId: Int, color: Int) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return
    }

    views.setColorStateList(
        viewId,
        "setProgressTintList",
        ColorStateList.valueOf(color),
    )
}

private fun tintProgressTrack(views: RemoteViews, viewId: Int, color: Int) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return
    }

    views.setColorStateList(
        viewId,
        "setProgressBackgroundTintList",
        ColorStateList.valueOf(color),
    )
}

private fun renderMediumWidget(
    context: Context,
    views: RemoteViews,
    data: PrayerWidgetData?,
) {
    if (data == null) {
        renderMediumSetupWidget(context, views)
        return
    }

    val focusIndex = data.currentIndex
    val focusedItems = (-2..2).map { offset ->
        data.timeline[(focusIndex + offset).coerceIn(0, data.timeline.lastIndex)]
    }

    applyMediumWidgetTheme(context, views)
    views.setTextViewText(R.id.widget_medium_time, formatTime(data.now, data.location))
    views.setTextViewText(R.id.widget_medium_status, formatMediumStatus(data))
    views.setTextViewText(R.id.widget_medium_place, data.location.label)
    views.setTextViewText(R.id.widget_medium_hijri, formatHijriDate(data.now, data.location))

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

private fun renderMediumSetupWidget(context: Context, views: RemoteViews) {
    applyMediumWidgetTheme(context, views)
    views.setTextViewText(R.id.widget_medium_time, "--:--")
    views.setTextViewText(R.id.widget_medium_status, "Set location")
    views.setTextViewText(R.id.widget_medium_place, "Open Al-Salah")
    views.setTextViewText(R.id.widget_medium_hijri, "")
    setMediumSetupSlot(views, R.id.widget_medium_slot_0_icon, R.id.widget_medium_slot_0_name)
    setMediumSetupSlot(views, R.id.widget_medium_slot_1_icon, R.id.widget_medium_slot_1_name)
    views.setImageViewResource(R.id.widget_medium_focus_icon, R.drawable.ic_namaz_fajr)
    views.setTextViewText(R.id.widget_medium_focus_name, "Location")
    setMediumSetupSlot(views, R.id.widget_medium_slot_3_icon, R.id.widget_medium_slot_3_name)
    setMediumSetupSlot(views, R.id.widget_medium_slot_4_icon, R.id.widget_medium_slot_4_name)
}

private fun renderLargeWidget(
    context: Context,
    views: RemoteViews,
    data: PrayerWidgetData?,
) {
    if (data == null) {
        renderLargeSetupWidget(context, views)
        return
    }

    val previous = data.timeline[(data.currentIndex - 1).coerceAtLeast(0)]
    val firstNext = data.next
    val secondNext = data.timeline[(data.currentIndex + 2).coerceAtMost(data.timeline.lastIndex)]

    applyLargeWidgetTheme(context, views)
    views.setTextViewText(R.id.widget_large_date, formatDisplayDate(data.now, data.location))
    views.setTextViewText(R.id.widget_large_time, formatTime(data.now, data.location))
    views.setTextViewText(R.id.widget_large_current_name, data.current.namaz.label)
    views.setTextViewText(R.id.widget_large_current_remaining, formatRemaining(data))
    views.setTextViewText(
        R.id.widget_large_current_time,
        formatTime(data.current.time, data.location),
    )
    views.setImageViewResource(R.id.widget_large_current_icon, data.current.namaz.icon)

    setLargePrayerRow(
        views,
        R.id.widget_large_dhuhr_icon,
        R.id.widget_large_dhuhr_name,
        R.id.widget_large_dhuhr_time,
        previous,
        data.location,
    )
    setLargePrayerRow(
        views,
        R.id.widget_large_maghrib_icon,
        R.id.widget_large_maghrib_name,
        R.id.widget_large_maghrib_time,
        firstNext,
        data.location,
    )
    setLargePrayerRow(
        views,
        R.id.widget_large_isha_icon,
        R.id.widget_large_isha_name,
        R.id.widget_large_isha_time,
        secondNext,
        data.location,
    )
}

private fun renderLargeSetupWidget(context: Context, views: RemoteViews) {
    applyLargeWidgetTheme(context, views)
    views.setTextViewText(R.id.widget_large_date, "Set location")
    views.setTextViewText(R.id.widget_large_time, "--:--")
    views.setTextViewText(R.id.widget_large_current_name, "Open Al-Salah")
    views.setTextViewText(R.id.widget_large_current_remaining, "Choose coordinates")
    views.setTextViewText(R.id.widget_large_current_time, "")
    views.setImageViewResource(R.id.widget_large_current_icon, R.drawable.ic_namaz_fajr)
    setLargeSetupRow(
        views,
        R.id.widget_large_dhuhr_icon,
        R.id.widget_large_dhuhr_name,
        R.id.widget_large_dhuhr_time,
    )
    setLargeSetupRow(
        views,
        R.id.widget_large_maghrib_icon,
        R.id.widget_large_maghrib_name,
        R.id.widget_large_maghrib_time,
    )
    setLargeSetupRow(
        views,
        R.id.widget_large_isha_icon,
        R.id.widget_large_isha_name,
        R.id.widget_large_isha_time,
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

private fun setMediumSetupSlot(
    views: RemoteViews,
    iconViewId: Int,
    labelViewId: Int,
) {
    views.setImageViewResource(iconViewId, R.drawable.ic_namaz_fajr)
    views.setTextViewText(labelViewId, "")
}

private fun setLargePrayerRow(
    views: RemoteViews,
    iconViewId: Int,
    labelViewId: Int,
    timeViewId: Int,
    item: NamazTime,
    location: ConfiguredPrayerLocation,
) {
    views.setImageViewResource(iconViewId, item.namaz.icon)
    views.setTextViewText(labelViewId, item.namaz.label)
    views.setTextViewText(timeViewId, formatTime(item.time, location))
}

private fun setLargeSetupRow(
    views: RemoteViews,
    iconViewId: Int,
    labelViewId: Int,
    timeViewId: Int,
) {
    views.setImageViewResource(iconViewId, R.drawable.ic_namaz_fajr)
    views.setTextViewText(labelViewId, "")
    views.setTextViewText(timeViewId, "")
}

private fun setLargeInactiveColors(
    views: RemoteViews,
    iconViewId: Int,
    labelViewId: Int,
    timeViewId: Int,
    palette: WidgetPalette,
) {
    setImageTint(views, iconViewId, palette.inactive)
    views.setTextColor(labelViewId, palette.inactive)
    views.setTextColor(timeViewId, palette.inactive)
}

private fun setLargeDefaultColors(
    views: RemoteViews,
    iconViewId: Int,
    labelViewId: Int,
    timeViewId: Int,
    palette: WidgetPalette,
) {
    setImageTint(views, iconViewId, palette.muted)
    views.setTextColor(labelViewId, palette.text)
    views.setTextColor(timeViewId, palette.muted)
}

private fun calculateWidgetData(context: Context, now: Date = Date()): PrayerWidgetData? {
    val ishaDeadlineMinutes = getConfiguredIshaDeadlineMinutes(context)
    val location = getConfiguredPrayerLocation(context) ?: return null
    val trackingDate = getTrackingDate(context, now, location)
    val yesterday = addDays(trackingDate, -1, location)
    val tomorrow = addDays(trackingDate, 1, location)
    val dayAfterTomorrow = addDays(trackingDate, 2, location)
    val timeline = prayerTimesForDate(trackingDate, location)
    val windows = prayerWindowsForDate(yesterday, trackingDate, ishaDeadlineMinutes, location) +
        prayerWindowsForDate(trackingDate, tomorrow, ishaDeadlineMinutes, location) +
        prayerWindowsForDate(tomorrow, dayAfterTomorrow, ishaDeadlineMinutes, location)
    val activeWindow = windows.firstOrNull { !now.before(it.start) && now.before(it.end) }
    val nextWindow = windows.firstOrNull { it.start.after(now) } ?: windows.last()
    val displayWindow = activeWindow ?: nextWindow
    val previousWindow = windows.asReversed().firstOrNull { !it.end.after(now) }
    val displayTime = NamazTime(displayWindow.namaz, displayWindow.start)
    val nextTime = NamazTime(nextWindow.namaz, nextWindow.start)
    val currentIndex = timeline.indexOfLast { !it.time.after(displayWindow.start) }
        .takeIf { it >= 0 }
        ?: timeline.indexOfFirst { it.namaz == displayWindow.namaz }.takeIf { it >= 0 }
        ?: 0

    return PrayerWidgetData(
        now = now,
        current = displayTime,
        next = nextTime,
        timeline = timeline,
        currentIndex = currentIndex.coerceIn(0, timeline.lastIndex),
        isPrayerActive = activeWindow != null,
        countdownStart = activeWindow?.start ?: previousWindow?.end ?: now,
        countdownEnd = activeWindow?.end ?: nextWindow.start,
        location = location,
    )
}

private fun prayerTimesForDate(
    date: Date,
    location: ConfiguredPrayerLocation,
): List<NamazTime> {
    val prayerTimes = dayPrayerTimesForDate(date, location)

    return listOf(
        NamazTime(Namaz.FAJR, prayerTimes.fajr),
        NamazTime(Namaz.DHUHR, prayerTimes.dhuhr),
        NamazTime(Namaz.ASR, prayerTimes.asr),
        NamazTime(Namaz.MAGHRIB, prayerTimes.maghrib),
        NamazTime(Namaz.ISHA, prayerTimes.isha),
    )
}

private fun prayerWindowsForDate(
    date: Date,
    nextDate: Date,
    ishaDeadlineMinutes: Int?,
    location: ConfiguredPrayerLocation,
): List<NamazWindow> {
    val prayerTimes = dayPrayerTimesForDate(date, location)
    val nextPrayerTimes = dayPrayerTimesForDate(nextDate, location)

    return listOf(
        NamazWindow(Namaz.FAJR, prayerTimes.fajr, prayerTimes.sunrise),
        NamazWindow(Namaz.DHUHR, prayerTimes.dhuhr, prayerTimes.asr),
        NamazWindow(Namaz.ASR, prayerTimes.asr, prayerTimes.maghrib),
        NamazWindow(Namaz.MAGHRIB, prayerTimes.maghrib, prayerTimes.isha),
        NamazWindow(
            Namaz.ISHA,
            prayerTimes.isha,
            resolveIshaDeadline(
                date,
                prayerTimes.maghrib,
                nextPrayerTimes.fajr,
                ishaDeadlineMinutes,
                location,
            ),
        ),
    )
}

private fun dayPrayerTimesForDate(
    date: Date,
    location: ConfiguredPrayerLocation,
): DayPrayerTimes {
    val params = CalculationMethod.KARACHI.getParameters()
    params.madhab = Madhab.HANAFI

    val prayerTimes = PrayerTimes(
        Coordinates(location.latitude, location.longitude),
        dateComponents(date, location),
        params,
    )

    return DayPrayerTimes(
        fajr = truncateToMinute(prayerTimes.fajr),
        sunrise = truncateToMinute(prayerTimes.sunrise),
        dhuhr = truncateToMinute(prayerTimes.dhuhr),
        asr = truncateToMinute(prayerTimes.asr),
        maghrib = truncateToMinute(prayerTimes.maghrib),
        isha = truncateToMinute(prayerTimes.isha),
    )
}

private fun calculateIslamicMidnight(maghrib: Date, nextFajr: Date): Date {
    return Date(maghrib.time + ((nextFajr.time - maghrib.time) / 2))
}

private fun resolveIshaDeadline(
    date: Date,
    maghrib: Date,
    nextFajr: Date,
    ishaDeadlineMinutes: Int?,
    location: ConfiguredPrayerLocation,
): Date {
    val minimum = calculateIslamicMidnight(maghrib, nextFajr)
    val maximum = createIshaDeadlineDate(date, MAX_ISHA_DEADLINE_MINUTES, location)
    val configuredMinutes = ishaDeadlineMinutes ?: return minimum
    val candidate = createIshaDeadlineDate(
        date,
        configuredMinutes.coerceIn(0, MAX_ISHA_DEADLINE_MINUTES),
        location,
    )

    return when {
        candidate.before(minimum) -> minimum
        candidate.after(maximum) -> maximum
        else -> candidate
    }
}

private fun getTrackingDate(
    context: Context,
    now: Date,
    location: ConfiguredPrayerLocation,
): Date {
    val today = createDateReference(now, 0, location)
    val yesterday = createDateReference(now, -1, location)
    val yesterdayPrayerTimes = dayPrayerTimesForDate(yesterday, location)
    val todayPrayerTimes = dayPrayerTimesForDate(today, location)
    val previousIshaDeadline = resolveIshaDeadline(
        yesterday,
        yesterdayPrayerTimes.maghrib,
        todayPrayerTimes.fajr,
        getConfiguredIshaDeadlineMinutes(context),
        location,
    )

    return if (now.before(previousIshaDeadline)) yesterday else today
}

private fun createDateReference(
    now: Date,
    dayOffset: Int,
    location: ConfiguredPrayerLocation,
): Date {
    val calendar = Calendar.getInstance(location.toTimeZone())
    calendar.time = now
    calendar.add(Calendar.DATE, dayOffset)
    calendar.set(Calendar.HOUR_OF_DAY, 12)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)

    return calendar.time
}

private fun createIshaDeadlineDate(
    date: Date,
    minutesFromDayStart: Int,
    location: ConfiguredPrayerLocation,
): Date {
    val calendar = Calendar.getInstance(location.toTimeZone())
    calendar.time = date
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    calendar.add(Calendar.MINUTE, minutesFromDayStart)

    return calendar.time
}

private fun addDays(
    date: Date,
    days: Int,
    location: ConfiguredPrayerLocation,
): Date {
    val calendar = Calendar.getInstance(location.toTimeZone())
    calendar.time = date
    calendar.add(Calendar.DATE, days)

    return calendar.time
}

private fun dateComponents(
    date: Date,
    location: ConfiguredPrayerLocation,
): DateComponents {
    val calendar = Calendar.getInstance(location.toTimeZone())
    calendar.time = date

    return DateComponents(
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH) + 1,
        calendar.get(Calendar.DAY_OF_MONTH),
    )
}

private fun truncateToMinute(date: Date): Date {
    val calendar = Calendar.getInstance()
    calendar.time = date
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)

    return calendar.time
}

private fun formatTime(date: Date, location: ConfiguredPrayerLocation): String {
    return SimpleDateFormat("HH:mm", Locale.US).apply {
        timeZone = location.toTimeZone()
    }.format(date)
}

private fun formatDisplayDate(date: Date, location: ConfiguredPrayerLocation): String {
    return SimpleDateFormat("EEEE, d MMM", Locale.US).apply {
        timeZone = location.toTimeZone()
    }.format(date)
}

private fun formatHijriDate(date: Date, location: ConfiguredPrayerLocation): String {
    val calendar = IslamicCalendar(IcuTimeZone.getTimeZone(location.timeZone), Locale.US)
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
    val duration = formatRemainingDuration(data)

    return if (data.isPrayerActive) {
        "$duration remaining"
    } else {
        "In $duration"
    }
}

private fun formatSmallRemaining(data: PrayerWidgetData): String {
    val duration = formatRemainingDuration(data)

    return if (data.isPrayerActive) {
        "$duration remaining"
    } else {
        "In $duration"
    }
}

private fun formatSmallFooter(data: PrayerWidgetData): String {
    return if (data.isPrayerActive) {
        "Next: ${data.next.namaz.label}"
    } else {
        "Starts: ${formatTime(data.next.time, data.location)}"
    }
}

private fun formatAodRemaining(data: PrayerWidgetData): String {
    val duration = formatRemainingDuration(data)

    return if (data.isPrayerActive) {
        "$duration left"
    } else {
        "In $duration"
    }
}

private fun formatMediumStatus(data: PrayerWidgetData): String {
    return if (data.isPrayerActive) {
        "Next: ${data.next.namaz.label}"
    } else {
        "In ${formatRemainingDuration(data)}"
    }
}

private fun formatRemainingDuration(data: PrayerWidgetData): String {
    val remainingMillis = (data.countdownEnd.time - data.now.time).coerceAtLeast(0)
    val totalMinutes = remainingMillis / 60_000
    val hours = totalMinutes / 60
    val minutes = totalMinutes % 60

    return when {
        remainingMillis < 60_000 -> "Less than a minute"
        hours > 0 -> "${hours}h ${minutes}m"
        else -> "${minutes}m"
    }
}

private fun calculateIntervalProgress(data: PrayerWidgetData): Int {
    val totalMillis = data.countdownEnd.time - data.countdownStart.time

    if (totalMillis <= 0) {
        return 0
    }

    val elapsedMillis = (data.now.time - data.countdownStart.time).coerceIn(0, totalMillis)

    return ((elapsedMillis * 1_000) / totalMillis).toInt()
}

private fun ConfiguredPrayerLocation.toTimeZone(): TimeZone {
    return TimeZone.getTimeZone(timeZone)
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
