-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  content_type TEXT NOT NULL,
  budget_min INTEGER NOT NULL,
  budget_max INTEGER NOT NULL,
  deadline DATE,
  location TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create applications table to track who applied to which offer
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (offer_id, creator_id)
);

-- Enable RLS on applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Update conversations table to link to offers
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL;

-- RLS Policies for offers

-- Anyone can view active offers
CREATE POLICY "Anyone can view active offers"
ON public.offers
FOR SELECT
USING (status = 'active');

-- Brands can view all their own offers
CREATE POLICY "Brands can view their own offers"
ON public.offers
FOR SELECT
USING (auth.uid() = brand_id);

-- Brands can create offers
CREATE POLICY "Brands can create offers"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = brand_id);

-- Brands can update their own offers
CREATE POLICY "Brands can update their own offers"
ON public.offers
FOR UPDATE
USING (auth.uid() = brand_id);

-- RLS Policies for applications

-- Creators can view their own applications
CREATE POLICY "Creators can view their own applications"
ON public.applications
FOR SELECT
USING (auth.uid() = creator_id);

-- Brands can view applications to their offers
CREATE POLICY "Brands can view applications to their offers"
ON public.applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.offers
    WHERE offers.id = applications.offer_id
    AND offers.brand_id = auth.uid()
  )
);

-- Creators can apply to offers
CREATE POLICY "Creators can apply to offers"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Brands can update application status
CREATE POLICY "Brands can update application status"
ON public.applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.offers
    WHERE offers.id = applications.offer_id
    AND offers.brand_id = auth.uid()
  )
);

-- Create trigger for offers timestamp
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for applications timestamp
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_offers_brand_id ON public.offers(brand_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_category ON public.offers(category);
CREATE INDEX idx_applications_offer_id ON public.applications(offer_id);
CREATE INDEX idx_applications_creator_id ON public.applications(creator_id);