import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNostrStore } from "@/lib/nostr/store";
import { EventKind, NostrEvent } from "@/lib/nostr/types";
import { formatTimestamp, truncateKey, replaceMentions, formatPublicKey } from "@/lib/nostr/utils";
import ReactMarkdown from "react-markdown";
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share,
  MoreHorizontal,
  Send,
  Image,
  Hash,
  AtSign,
  Search,
  Filter,
  ChevronDown,
  AlertCircle
} from "lucide-react";

export function NostrFeed() {
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "following" | "trending">("all");
  const [displayLimit, setDisplayLimit] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(20);
  }, [searchQuery, filterType]);
  
  const { 
    events, 
    profiles, 
    publishEvent,
    likeEvent,
    repostEvent,
    replyToEvent,
    isConnecting,
    error
  } = useNostrStore();

  // Filter and sort feed events with performance optimizations
  const feedEvents = useMemo(() => {
    // Ensure events is a Map object
    if (!events || typeof events !== 'object' || !events.values) {
      return [];
    }
    
    let textNotes = Array.from(events.values())
      .filter(event => event.kind === EventKind.TextNote)
      .sort((a, b) => b.created_at - a.created_at);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      textNotes = textNotes.filter(event => 
        event.content.toLowerCase().includes(query) ||
        event.pubkey.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType === "trending") {
      // Sort by engagement (likes, reposts, replies) - simplified for now
      textNotes = textNotes.slice(0, 50); // Limit for trending calculation
    }

    // Limit display
    return textNotes.slice(0, displayLimit);
  }, [events, searchQuery, filterType, displayLimit]);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayLimit(prev => prev + 10);
      setIsLoadingMore(false);
    }, 500);
  }, []);

  const handlePost = async () => {
    if (!postContent.trim()) return;
    
    setIsPosting(true);
    try {
      await publishEvent(postContent, EventKind.TextNote);
      setPostContent("");
    } finally {
      setIsPosting(false);
    }
  };

  const handleReply = async (event: NostrEvent) => {
    if (!postContent.trim()) return;
    
    setIsPosting(true);
    try {
      await replyToEvent(event, postContent);
      setPostContent("");
      setReplyingTo(null);
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (replyingTo) {
        const event = events && typeof events.get === 'function' ? events.get(replyingTo) : undefined;
        if (event) handleReply(event);
      } else {
        handlePost();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Post Composer */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {replyingTo && (
              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">
                  Replying to post...
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            <Textarea
              placeholder="What's on your mind?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[100px] resize-none"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Image className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Hash className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <AtSign className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {postContent.length}/280
                </span>
                <Button 
                  onClick={() => replyingTo && events && typeof events.get === 'function' ? handleReply(events.get(replyingTo)!) : handlePost()}
                  disabled={!postContent.trim() || isPosting}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {replyingTo ? "Reply" : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Button
                variant="outline"
                className="w-40 justify-between"
                onClick={() => setFilterType(prev => prev === "all" ? "following" : prev === "following" ? "trending" : "all")}
              >
                {filterType === "all" ? "All Posts" : filterType === "following" ? "Following" : "Trending"}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      <div className="space-y-4">
        {/* Loading State */}
        {isConnecting && feedEvents.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading feed...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isConnecting && feedEvents.length === 0 && !error ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? "No posts match your search." : "No posts yet. Be the first to post!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {feedEvents.map((event) => (
              <FeedPost 
                key={event.id} 
                event={event}
                profile={profiles && typeof profiles.get === 'function' ? profiles.get(event.pubkey) : undefined}
                onReply={() => setReplyingTo(event.id)}
              />
            ))}
            
            {/* Load More Button */}
            {feedEvents.length >= displayLimit && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full"
                >
                  {isLoadingMore ? (
                    "Loading..."
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Load More Posts
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface FeedPostProps {
  event: NostrEvent;
  profile?: any;
  onReply: () => void;
}

function FeedPost({ event, profile, onReply }: FeedPostProps) {
  const { likeEvent, repostEvent } = useNostrStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Memoize expensive computations
  const isReply = useMemo(() => 
    event.tags.some(tag => tag[0] === 'e' && tag[3] === 'reply'), 
    [event.tags]
  );

  const handleLike = useCallback(async () => {
    if (isLiked) return;
    setIsLiked(true);
    await likeEvent(event.id);
  }, [isLiked, likeEvent, event.id]);

  const handleRepost = useCallback(async () => {
    if (isReposted) return;
    setIsReposted(true);
    await repostEvent(event);
  }, [isReposted, repostEvent, event]);
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={profile?.picture} />
              <AvatarFallback>
                {profile?.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">
                  {profile?.display_name || profile?.name || formatPublicKey(event.pubkey)}
                </h4>
                {profile?.nip05 && (
                  <Badge variant="secondary" className="text-xs">
                    {profile.nip05}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatPublicKey(event.pubkey)} · {formatTimestamp(event.created_at)}
              </p>
            </div>
          </div>
          
          {showActions && (
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Reply indicator */}
        {isReply && (
          <div className="text-sm text-muted-foreground mb-2">
            <MessageCircle className="w-3 h-3 inline mr-1" />
            Replying to a post
          </div>
        )}

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {children}
                </a>
              ),
              p: ({ children }) => <p className="mb-2">{children}</p>
            }}
          >
            {replaceMentions(event.content)}
          </ReactMarkdown>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:text-primary"
            onClick={onReply}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Reply</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 hover:text-green-600 ${isReposted ? 'text-green-600' : ''}`}
            onClick={handleRepost}
          >
            <Repeat2 className="w-4 h-4" />
            <span className="text-xs">{isReposted ? 'Reposted' : 'Repost'}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 hover:text-red-600 ${isLiked ? 'text-red-600' : ''}`}
            onClick={handleLike}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{isLiked ? 'Liked' : 'Like'}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:text-primary"
          >
            <Share className="w-4 h-4" />
            <span className="text-xs">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}