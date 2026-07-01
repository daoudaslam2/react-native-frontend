package com.alsalah.qibla

import android.content.Context
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.view.Surface
import android.view.WindowManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.abs

@ReactModule(name = CompassHeadingModule.NAME)
class CompassHeadingModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext), SensorEventListener, LifecycleEventListener {

    private val sensorManager =
        reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val rotationVectorSensor =
        sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
    private val accelerometer =
        sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val magnetometer =
        sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
    private val rotationMatrix = FloatArray(9)
    private val adjustedRotationMatrix = FloatArray(9)
    private val orientationValues = FloatArray(3)
    private val gravityValues = FloatArray(3)
    private val magneticValues = FloatArray(3)
    private var hasGravityValues = false
    private var hasMagneticValues = false
    private var shouldListen = false
    private var isListening = false
    private var usesRotationVector = false
    private var magneticDeclination = 0f
    private var currentAccuracy = SensorManager.SENSOR_STATUS_UNRELIABLE
    private var lastHeading: Float? = null
    private var lastEmitTime = 0L

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun start(latitude: Double, longitude: Double, promise: Promise) {
        magneticDeclination = GeomagneticField(
            latitude.toFloat(),
            longitude.toFloat(),
            0f,
            System.currentTimeMillis(),
        ).declination
        shouldListen = true

        promise.resolve(startSensors())
    }

    @ReactMethod
    fun stop(promise: Promise) {
        shouldListen = false
        stopSensors()
        promise.resolve(true)
    }

    @ReactMethod
    fun addListener(eventName: String) = Unit

    @ReactMethod
    fun removeListeners(count: Int) = Unit

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_ROTATION_VECTOR -> handleRotationVector(event)
            Sensor.TYPE_ACCELEROMETER -> {
                lowPass(event.values, gravityValues)
                hasGravityValues = true
                handleAccelerometerAndMagnetometer()
            }
            Sensor.TYPE_MAGNETIC_FIELD -> {
                lowPass(event.values, magneticValues)
                hasMagneticValues = true
                currentAccuracy = event.accuracy
                handleAccelerometerAndMagnetometer()
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        currentAccuracy = accuracy
    }

    override fun onHostResume() {
        if (shouldListen) {
            startSensors()
        }
    }

    override fun onHostPause() {
        stopSensors()
    }

    override fun onHostDestroy() {
        shouldListen = false
        stopSensors()
        reactContext.removeLifecycleEventListener(this)
    }

    override fun invalidate() {
        shouldListen = false
        stopSensors()
        reactContext.removeLifecycleEventListener(this)
        super.invalidate()
    }

    private fun startSensors(): Boolean {
        if (isListening) {
            return true
        }

        if (rotationVectorSensor != null) {
            usesRotationVector = true
            isListening = sensorManager.registerListener(
                this,
                rotationVectorSensor,
                SensorManager.SENSOR_DELAY_UI,
            )
            return isListening
        }

        if (accelerometer == null || magnetometer == null) {
            isListening = false
            return false
        }

        usesRotationVector = false
        hasGravityValues = false
        hasMagneticValues = false
        val accelerometerStarted = sensorManager.registerListener(
            this,
            accelerometer,
            SensorManager.SENSOR_DELAY_UI,
        )
        val magnetometerStarted = sensorManager.registerListener(
            this,
            magnetometer,
            SensorManager.SENSOR_DELAY_UI,
        )
        isListening = accelerometerStarted && magnetometerStarted

        return isListening
    }

    private fun stopSensors() {
        if (!isListening) {
            return
        }

        sensorManager.unregisterListener(this)
        isListening = false
        lastHeading = null
        lastEmitTime = 0L
    }

    private fun handleRotationVector(event: SensorEvent) {
        currentAccuracy = event.accuracy
        SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
        emitHeadingFromRotationMatrix()
    }

    private fun handleAccelerometerAndMagnetometer() {
        if (
            usesRotationVector ||
            !hasGravityValues ||
            !hasMagneticValues ||
            !SensorManager.getRotationMatrix(
                rotationMatrix,
                null,
                gravityValues,
                magneticValues,
            )
        ) {
            return
        }

        emitHeadingFromRotationMatrix()
    }

    private fun emitHeadingFromRotationMatrix() {
        adjustForDisplayRotation(rotationMatrix, adjustedRotationMatrix)
        SensorManager.getOrientation(adjustedRotationMatrix, orientationValues)

        val magneticHeading = Math.toDegrees(orientationValues[0].toDouble()).toFloat()
        val trueHeading = normalizeDegrees(magneticHeading + magneticDeclination)

        emitHeading(trueHeading)
    }

    private fun emitHeading(heading: Float) {
        val now = System.currentTimeMillis()
        val previousHeading = lastHeading

        if (
            previousHeading != null &&
            now - lastEmitTime < MIN_EMIT_INTERVAL_MS &&
            angleDelta(previousHeading, heading) < MIN_HEADING_DELTA_DEGREES
        ) {
            return
        }

        lastHeading = heading
        lastEmitTime = now

        val payload = Arguments.createMap().apply {
            putDouble("heading", heading.toDouble())
            putInt("accuracy", currentAccuracy)
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_NAME, payload)
    }

    private fun adjustForDisplayRotation(source: FloatArray, destination: FloatArray) {
        when (getDisplayRotation()) {
            Surface.ROTATION_90 -> SensorManager.remapCoordinateSystem(
                source,
                SensorManager.AXIS_Y,
                SensorManager.AXIS_MINUS_X,
                destination,
            )
            Surface.ROTATION_180 -> SensorManager.remapCoordinateSystem(
                source,
                SensorManager.AXIS_MINUS_X,
                SensorManager.AXIS_MINUS_Y,
                destination,
            )
            Surface.ROTATION_270 -> SensorManager.remapCoordinateSystem(
                source,
                SensorManager.AXIS_MINUS_Y,
                SensorManager.AXIS_X,
                destination,
            )
            else -> source.copyInto(destination)
        }
    }

    private fun getDisplayRotation(): Int {
        val activity = getCurrentActivity()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return activity?.display?.rotation ?: Surface.ROTATION_0
        }

        @Suppress("DEPRECATION")
        return (reactContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager)
            .defaultDisplay
            .rotation
    }

    private fun lowPass(input: FloatArray, output: FloatArray) {
        for (index in 0 until 3) {
            output[index] = output[index] + LOW_PASS_ALPHA * (input[index] - output[index])
        }
    }

    private fun normalizeDegrees(value: Float): Float {
        val normalized = value % 360f

        return if (normalized < 0f) normalized + 360f else normalized
    }

    private fun angleDelta(first: Float, second: Float): Float {
        val difference = abs(first - second) % 360f

        return if (difference > 180f) 360f - difference else difference
    }

    companion object {
        const val NAME = "AlSalahCompassHeading"
        const val EVENT_NAME = "AlSalahCompassHeadingChanged"
        private const val LOW_PASS_ALPHA = 0.15f
        private const val MIN_HEADING_DELTA_DEGREES = 0.7f
        private const val MIN_EMIT_INTERVAL_MS = 90L
    }
}
