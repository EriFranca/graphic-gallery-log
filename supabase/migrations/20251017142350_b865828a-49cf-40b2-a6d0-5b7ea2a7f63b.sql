-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT,
  start_year INTEGER,
  cover_url TEXT,
  comic_vine_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issues table with condition rating
CREATE TABLE public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  issue_number TEXT NOT NULL,
  name TEXT,
  cover_url TEXT,
  cover_color TEXT,
  is_owned BOOLEAN NOT NULL DEFAULT false,
  condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
CREATE POLICY "Users can view their own collections" 
ON public.collections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" 
ON public.collections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for issues
CREATE POLICY "Users can view issues of their collections" 
ON public.issues 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = issues.collection_id 
  AND collections.user_id = auth.uid()
));

CREATE POLICY "Users can create issues for their collections" 
ON public.issues 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = issues.collection_id 
  AND collections.user_id = auth.uid()
));

CREATE POLICY "Users can update issues of their collections" 
ON public.issues 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = issues.collection_id 
  AND collections.user_id = auth.uid()
));

CREATE POLICY "Users can delete issues of their collections" 
ON public.issues 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = issues.collection_id 
  AND collections.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
BEFORE UPDATE ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();