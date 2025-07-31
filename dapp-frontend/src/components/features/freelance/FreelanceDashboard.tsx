import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/Header";
import { formatTokenAmount, formatTimeAgo, truncateAddress } from "@/lib/utils";
import { FreelanceJob } from "@/lib/types";
import { useFreelanceContract } from "@/hooks/useContract";
import { useAppState } from "@/contexts/AppContext";
import { 
  Briefcase, 
  Plus, 
  Search,
  Filter,
  Clock,
  DollarSign,
  User,
  Eye,
  MessageCircle,
  TrendingUp
} from "lucide-react";

interface JobCardProps {
  job: FreelanceJob;
  userAddress?: string;
  onApply?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
}

function JobCard({ job, userAddress, onApply, onViewDetails }: JobCardProps) {
  const timeRemaining = Math.ceil((job.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{formatTokenAmount(job.budget)} ETH</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{timeRemaining}d left</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{truncateAddress(job.client)}</span>
              </div>
            </div>
          </div>
          
          <Badge 
            variant={
              job.status === 'open' ? 'default' :
              job.status === 'in-progress' ? 'warning' :
              job.status === 'completed' ? 'success' : 'destructive'
            }
          >
            {job.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {job.skills.map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails?.(job.id)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
          
          {job.status === 'open' && (
            <Button 
              size="sm" 
              onClick={() => onApply?.(job.id)}
              className="flex-1"
            >
              Apply Now
            </Button>
          )}
          
          {job.status === 'in-progress' && job.freelancer === userAddress && (
            <Button 
              size="sm" 
              onClick={() => console.log("Contact client")}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Contact Client
            </Button>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground">
          Posted {formatTimeAgo(job.createdAt)}
        </div>
      </CardContent>
    </Card>
  );
}

export function FreelanceDashboard() {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-jobs' | 'posted'>('browse');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get real data from hooks
  const { allJobs, myJobs, isLoading } = useFreelanceContract();
  const { userAddress } = useAppState();

  // Filter jobs based on active tab
  const filteredJobs = (activeTab === 'my-jobs' ? myJobs : allJobs).filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'browse':
        return job.status === 'open';
      case 'my-jobs':
        return job.freelancer === userAddress;
      case 'posted':
        return job.client === userAddress;
      default:
        return true;
    }
  });

  const handleApply = (jobId: string) => {
    console.log("Applying to job:", jobId);
    // Implementation would open application modal
  };

  const handleViewDetails = (jobId: string) => {
    console.log("View job details:", jobId);
    // Implementation would navigate to job details page
  };

  // Stats for dashboard
  const stats = {
    totalJobs: allJobs.length,
    activeJobs: allJobs.filter(j => j.status === 'open').length,
    myJobs: myJobs.length,
    earnings: BigInt(0), // This should come from user profile or contract
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Freelance Marketplace"
        description="Find opportunities and offer your services"
        breadcrumbs={[
          { label: "App", href: "/app" },
          { label: "Freelance" }
        ]}
      >
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Post Job
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">Open for applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Active Jobs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myJobs}</div>
            <p className="text-xs text-muted-foreground">Currently working on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTokenAmount(stats.earnings)} ETH</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Project completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              {[
                { id: 'browse', label: 'Browse Jobs', count: stats.activeJobs },
                { id: 'my-jobs', label: 'My Jobs', count: stats.myJobs },
                { id: 'posted', label: 'Posted Jobs', count: 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant={activeTab === tab.id ? "secondary" : "outline"} className="text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Category:</span>
            {['all', 'smart-contracts', 'frontend', 'backend', 'design'].map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category.replace('-', ' ')}
              </Badge>
            ))}
          </div>

          {/* Job List */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {activeTab === 'browse' && "No jobs found"}
                {activeTab === 'my-jobs' && "No active jobs"}
                {activeTab === 'posted' && "No posted jobs"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'browse' && "Try adjusting your search criteria or check back later"}
                {activeTab === 'my-jobs' && "Apply to jobs to see them here"}
                {activeTab === 'posted' && "Post your first job to get started"}
              </p>
              <Button>
                {activeTab === 'posted' ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Post Job
                  </>
                ) : (
                  "Browse Available Jobs"
                )}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  userAddress={userAddress}
                  onApply={handleApply}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}