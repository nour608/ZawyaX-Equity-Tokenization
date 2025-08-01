import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/layout/Header";
import { formatTokenAmount, formatTimeAgo, getInitials, truncateAddress } from "@/lib/utils";
import { UserProfile } from "@/lib/types";
import { useUserRegistry } from "@/hooks/useContract";
import { useUserProfile } from "@/contexts/AppContext";
import { 
  User, 
  Edit3, 
  Star, 
  Trophy, 
  Calendar,
  Link as LinkIcon,
  Github,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export function ProfileDashboard() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'history'>('overview');
  
  // Get real data from hooks and context
  const { userProfile: contractProfile, updateProfile, isLoading, error: contractError } = useUserRegistry();
  const { profile: contextProfile } = useUserProfile();
  
  // Use contract profile if available, otherwise fall back to context profile
  const profileData = contractProfile || contextProfile;
  
  const [profileForm, setProfileForm] = useState<UserProfile>(
    profileData || {
      address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      name: '',
      bio: '',
      avatar: '/images/default-avatar.png',
      socialLinks: { twitter: '', github: '', linkedin: '' },
      reputation: 0,
      completedJobs: 0,
      totalEarnings: BigInt(0),
      skills: [],
      joinedAt: new Date()
    }
  );

  const handleSave = () => {
    // Implementation would save profile data
    setIsEditing(false);
    console.log("Saving profile data:", profileData);
  };

  const handleCancel = () => {
    // Reset to original data
    setProfileForm(profileData || {
      address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      name: '',
      bio: '',
      avatar: '/images/default-avatar.png',
      socialLinks: { twitter: '', github: '', linkedin: '' },
      reputation: 0,
      completedJobs: 0,
      totalEarnings: BigInt(0),
      skills: [],
      joinedAt: new Date()
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Contract Configuration Warning */}
      {contractError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contract Not Configured</AlertTitle>
          <AlertDescription>
            Smart contracts are not configured. Profile data will be stored locally only.
            {contractError}
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <PageHeader
        title="Profile"
        description="Manage your profile and reputation"
        breadcrumbs={[
          { label: "App", href: "/app" },
          { label: "Profile" }
        ]}
      >
        <Button 
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileForm.avatar} alt={profileForm.name} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profileForm.name || "User")}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={profileForm.name || ""}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    placeholder="Your name"
                  />
                  <textarea
                    value={profileForm.bio || ""}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    className="w-full p-2 text-sm border rounded-md resize-none"
                    rows={3}
                  />
                </div>
              ) : (
                <>
                  <CardTitle className="text-xl">{profileForm.name || "Anonymous User"}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {profileForm.bio || "No bio provided"}
                  </p>
                </>
              )}

              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{profileForm.reputation}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{profileForm.completedJobs}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Wallet Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Wallet</span>
                  <span className="font-mono">
                    {profileForm.address.slice(0, 6)}...{profileForm.address.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatTimeAgo(profileForm.joinedAt)}</span>
              </div>

              {/* Social Links */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Social Links</h4>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Twitter username"
                      value={profileForm.socialLinks?.twitter || ""}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        socialLinks: { ...profileForm.socialLinks, twitter: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="GitHub username"
                      value={profileForm.socialLinks?.github || ""}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        socialLinks: { ...profileForm.socialLinks, github: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="LinkedIn username"
                      value={profileForm.socialLinks?.linkedin || ""}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        socialLinks: { ...profileForm.socialLinks, linkedin: e.target.value }
                      })}
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {profileForm.socialLinks?.twitter && (
                      <Button variant="outline" size="icon">
                        <Twitter className="w-4 h-4" />
                      </Button>
                    )}
                    {profileForm.socialLinks?.github && (
                      <Button variant="outline" size="icon">
                        <Github className="w-4 h-4" />
                      </Button>
                    )}
                    {profileForm.socialLinks?.linkedin && (
                      <Button variant="outline" size="icon">
                        <Linkedin className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Save/Cancel Buttons */}
              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="flex-1">
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{profileForm.completedJobs}</div>
                  <div className="text-xs text-muted-foreground">Jobs Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profileForm.reputation}</div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Earnings</span>
                  <span className="font-medium">{formatTokenAmount(profileForm.totalEarnings)} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium text-green-600">98%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Add skills (comma separated)"
                    value={profileForm.skills.join(", ")}
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add skills relevant to your expertise (e.g., Solidity, React, Python)
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profileForm.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock activity items */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed smart contract audit project</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                  <Badge variant="success">+0.5 ETH</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Received 5-star rating from client</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                  <Badge variant="outline">★ 5.0</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Profile viewed by 15 potential clients</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio/Work Samples */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showcase your best work to attract more clients
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No portfolio items yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your best work samples to showcase your skills
                </p>
                <Button>Add Portfolio Item</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}