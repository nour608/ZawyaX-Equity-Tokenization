import React from "react";
import { useActiveAccount } from "thirdweb/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Briefcase,
  TrendingUp,
  DollarSign,
  Activity,
  Plus,
  ArrowUpRight
} from "lucide-react";

const stats = [
  {
    title: "Portfolio Value",
    value: "$12,345",
    change: "+12.5%",
    icon: TrendingUp,
    positive: true
  },
  {
    title: "Active Projects",
    value: "3",
    change: "+1 this month",
    icon: Building2,
    positive: true
  },
  {
    title: "Total Earnings",
    value: "$2,890",
    change: "+8.2%",
    icon: DollarSign,
    positive: true
  },
  {
    title: "Active Chats",
    value: "12",
    change: "2 unread",
    icon: MessageSquare,
    positive: false
  }
];

const recentActivities = [
  {
    id: 1,
    type: "equity",
    title: "TechStart tokens minted",
    description: "500 TECH tokens successfully created",
    time: "2 hours ago",
    icon: Building2
  },
  {
    id: 2,
    type: "freelance",
    title: "Smart Contract job completed",
    description: "Payment of $850 received",
    time: "5 hours ago",
    icon: Briefcase
  },
  {
    id: 3,
    type: "chat",
    title: "New message from investor",
    description: "John Doe is interested in your project",
    time: "1 day ago",
    icon: MessageSquare
  }
];

export function DashboardPage() {
  const account = useActiveAccount();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
          <p className="text-muted-foreground">
            Connected as {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.positive ? 'text-green-600' : 'text-muted-foreground'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Building2 className="w-4 h-4 mr-2" />
              Create Equity Token
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Find Freelancers
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Conversation
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Featured Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Equity</Badge>
                <Button size="sm" variant="ghost">
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-semibold">GreenTech Startup</h3>
              <p className="text-sm text-muted-foreground">
                Looking for $100K in funding. 5% equity offering.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>12 investors interested</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Freelance</Badge>
                <Button size="sm" variant="ghost">
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-semibold">DeFi Protocol Audit</h3>
              <p className="text-sm text-muted-foreground">
                Security audit needed for lending protocol. $5K budget.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="w-3 h-3" />
                <span>Expert level required</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}