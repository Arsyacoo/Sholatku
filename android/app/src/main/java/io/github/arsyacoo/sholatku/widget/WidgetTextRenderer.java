package io.github.arsyacoo.sholatku.widget;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.util.TypedValue;
import androidx.core.content.res.ResourcesCompat;

/**
 * Launchers ignore {@code android:fontFamily="@font/..."} in RemoteViews, so display text in the
 * brand fonts is drawn into a bitmap here. Sizes are in sp and follow the system font scale.
 */
final class WidgetTextRenderer {
    private WidgetTextRenderer() {}

    static Bitmap render(Context context, String text, int fontRes, float sizeSp, int color) {
        return render(context, text, "", fontRes, sizeSp, color, color);
    }

    /** Draws {@code primary} in the brand font, then an optional {@code secondary} label in the system face. */
    static Bitmap render(
        Context context, String primary, String secondary, int fontRes, float sizeSp, int primaryColor, int secondaryColor
    ) {
        float textSize = TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_SP, sizeSp, context.getResources().getDisplayMetrics()
        );
        Paint primaryPaint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        primaryPaint.setTypeface(loadTypeface(context, fontRes));
        primaryPaint.setTextSize(textSize);
        primaryPaint.setColor(primaryColor);

        Paint secondaryPaint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        secondaryPaint.setTextSize(textSize * 0.85f);
        secondaryPaint.setColor(secondaryColor);

        String safePrimary = primary.isEmpty() ? " " : primary;
        String gap = secondary.isEmpty() ? "" : "  ";
        float primaryWidth = primaryPaint.measureText(safePrimary + gap);
        Paint.FontMetrics metrics = primaryPaint.getFontMetrics();
        int width = Math.max(1, (int) Math.ceil(primaryWidth + secondaryPaint.measureText(secondary)));
        int height = Math.max(1, (int) Math.ceil(metrics.descent - metrics.ascent));

        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawText(safePrimary, 0, -metrics.ascent, primaryPaint);
        if (!secondary.isEmpty()) canvas.drawText(secondary, primaryWidth, -metrics.ascent, secondaryPaint);
        return bitmap;
    }

    private static Typeface loadTypeface(Context context, int fontRes) {
        try {
            Typeface typeface = ResourcesCompat.getFont(context, fontRes);
            if (typeface != null) return typeface;
        } catch (RuntimeException ignored) {
            // Fall back to the system face rather than leaving the widget blank.
        }
        return Typeface.DEFAULT_BOLD;
    }
}
