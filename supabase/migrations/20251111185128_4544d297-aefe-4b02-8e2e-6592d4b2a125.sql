-- Create metro stations table
CREATE TABLE IF NOT EXISTS public.metro_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_name TEXT NOT NULL,
  station_name_ar TEXT,
  line_name TEXT NOT NULL,
  line_color TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.metro_stations ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Metro stations are viewable by everyone" 
ON public.metro_stations 
FOR SELECT 
USING (true);

-- Insert Riyadh Metro stations data (Lines 1-6)
-- Line 1 (Blue Line) - North-South
INSERT INTO public.metro_stations (station_name, station_name_ar, line_name, line_color, latitude, longitude) VALUES
('Olaya', 'العليا', 'Line 1', '#0066CC', 24.6946, 46.6868),
('King Abdullah Financial District', 'حي المال', 'Line 1', '#0066CC', 24.7716, 46.6329),
('Riyadh Park', 'الرياض بارك', 'Line 1', '#0066CC', 24.7543, 46.6542),
('King Saud University', 'جامعة الملك سعود', 'Line 1', '#0066CC', 24.7253, 46.6194),
('Qasr Al Hokm', 'قصر الحكم', 'Line 1', '#0066CC', 24.6299, 46.7158),
('Al Bathaa', 'البطحاء', 'Line 1', '#0066CC', 24.6409, 46.7197);

-- Line 2 (Red Line) - East-West
INSERT INTO public.metro_stations (station_name, station_name_ar, line_name, line_color, latitude, longitude) VALUES
('King Abdullah Road', 'طريق الملك عبدالله', 'Line 2', '#CC0000', 24.6946, 46.7340),
('Khurais Road', 'طريق الخريص', 'Line 2', '#CC0000', 24.6946, 46.8245),
('Western Ring Road', 'الطريق الدائري الغربي', 'Line 2', '#CC0000', 24.6946, 46.6100);

-- Line 3 (Orange Line)
INSERT INTO public.metro_stations (station_name, station_name_ar, line_name, line_color, latitude, longitude) VALUES
('Medical City', 'المدينة الطبية', 'Line 3', '#FF6600', 24.7336, 46.6660),
('Diplomatic Quarter', 'الحي الدبلوماسي', 'Line 3', '#FF6600', 24.7687, 46.6181),
('Irqah', 'عرقة', 'Line 3', '#FF6600', 24.8124, 46.6430);

-- Line 4 (Yellow Line)
INSERT INTO public.metro_stations (station_name, station_name_ar, line_name, line_color, latitude, longitude) VALUES
('Takhasusi', 'التخصصي', 'Line 4', '#FFCC00', 24.7135, 46.6765),
('Al Sulimaniyah', 'السليمانية', 'Line 4', '#FFCC00', 24.7278, 46.7037),
('Airport', 'المطار', 'Line 4', '#FFCC00', 24.9571, 46.6983);

-- Line 5 (Green Line)
INSERT INTO public.metro_stations (station_name, station_name_ar, line_name, line_color, latitude, longitude) VALUES
('Sports Boulevard', 'بوليفارد الرياضي', 'Line 5', '#00CC66', 24.6701, 46.7037),
('King Salman Park', 'منتزه الملك سلمان', 'Line 5', '#00CC66', 24.6455, 46.7503),
('Riyadh Zoo', 'حديقة الحيوان', 'Line 5', '#00CC66', 24.7987, 46.6504);

-- Line 6 (Purple Line)
INSERT INTO public.metro_stations (station_name, station_name_ar, line_name, line_color, latitude, longitude) VALUES
('Granada', 'غرناطة', 'Line 6', '#9966CC', 24.7489, 46.7234),
('Imam University', 'جامعة الإمام', 'Line 6', '#9966CC', 24.8145, 46.7234),
('Al Yasmin', 'الياسمين', 'Line 6', '#9966CC', 24.7723, 46.7580);

-- Create index for faster queries
CREATE INDEX idx_metro_stations_location ON public.metro_stations(latitude, longitude);