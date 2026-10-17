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
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        paint.setTypeface(loadTypeface(context, fontRes));
        paint.setTextSize(TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_SP, sizeSp, context.getResources().getDisplayMetrics()
        ));
        paint.setColor(color);

        String safeText = text.isEmpty() ? " " : text;
        Paint.FontMetrics metrics = paint.getFontMetrics();
        int width = Math.max(1, (int) Math.ceil(paint.measureText(safeText)));
        int height = Math.max(1, (int) Math.ceil(metrics.descent - metrics.ascent));

        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        new Canvas(bitmap).drawText(safeText, 0, -metrics.ascent, paint);
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
