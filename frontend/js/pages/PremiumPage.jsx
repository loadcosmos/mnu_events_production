import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Crown,
  Sparkles,
  Zap,
  ArrowLeft,
  Bell,
} from 'lucide-react';

export default function PremiumPage() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <div className="flex justify-center">
          <div className="relative">
            <Crown className="w-24 h-24 text-amber-400 animate-pulse" />
            <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
          Premium Membership
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock exclusive features and take your event experience to the next level
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 backdrop-blur-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-400" />
            <div>
              <CardTitle className="text-2xl">Coming Soon!</CardTitle>
              <CardDescription>We're working hard to bring you something amazing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview Features */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">What to Expect:</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <Crown className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-medium">Priority Event Access</div>
                  <div className="text-sm text-muted-foreground">
                    Early registration and exclusive premium events
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <Sparkles className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-medium">Reduced Commission Rates</div>
                  <div className="text-sm text-muted-foreground">
                    Save on event fees with special premium pricing
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <Zap className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-medium">Advanced Analytics</div>
                  <div className="text-sm text-muted-foreground">
                    Detailed insights and reporting for your events
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <Bell className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-medium">Premium Support</div>
                  <div className="text-sm text-muted-foreground">
                    Priority customer support and dedicated assistance
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Teaser */}
          <div className="p-6 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-center">
            <div className="text-3xl font-bold text-amber-400 mb-2">
              500 ₸/month
            </div>
            <div className="text-sm text-muted-foreground">
              Expected pricing when launched
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Want to be notified when Premium launches?
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold"
              onClick={() => toast.info('Notification feature coming soon!')}
            >
              <Bell className="w-5 h-5 mr-2" />
              Notify Me
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-blue-400 mb-1">Stay tuned!</p>
              <p>
                Premium membership will be available soon. Follow our social media or check back here
                for updates on the launch date.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
