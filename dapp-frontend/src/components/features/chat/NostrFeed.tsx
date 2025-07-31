import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNostrStore } from "@/lib/nostr/store";
import { EventKind, NostrEvent } from "@/lib/nostr/types";
import { formatTimestamp, truncateKey, replaceMentions } from "@/lib/nostr/utils";
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
  AtSign
} from "lucide-react";

export function NostrFeed() {
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const { 
    events, 
    profiles, 
    publishEvent,
    likeEvent,
    repostEvent,
    replyToEvent
  } = useNostrStore();

  // Filter and sort feed events
  const feedEvents = useMemo(() => {
    const textNotes = Array.from(events.values())
      .filter(event => event.kind === EventKind.TextNote)
      .sort((a, b) => b.created_at - a.created_at);
    
    return textNotes;
  }, [events]);

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
        const event = events.get(replyingTo);
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
                  onClick={() => replyingTo ? handleReply(events.get(replyingTo)!) : handlePost()}
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

      {/* Feed */}
      <div className="space-y-4">
        {feedEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No posts yet. Be the first to post!
              </p>
            </CardContent>
          </Card>
        ) : (
          feedEvents.map((event) => (
            <FeedPost 
              key={event.id} 
              event={event}
              profile={profiles.get(event.pubkey)}
              onReply={() => setReplyingTo(event.id)}
            />
          ))
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

  const handleLike = async () => {
    if (isLiked) return;
    setIsLiked(true);
    await likeEvent(event.id);
  };

  const handleRepost = async () => {
    if (isReposted) return;
    setIsReposted(true);
    await repostEvent(event);
  };

  // Parse content for replies
  const isReply = event.tags.some(tag => tag[0] === 'e' && tag[3] === 'reply');
  
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
                  {profile?.display_name || profile?.name || truncateKey(event.pubkey, 8)}
                </h4>
                {profile?.nip05 && (
                  <Badge variant="secondary" className="text-xs">
                    {profile.nip05}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {truncateKey(event.pubkey, 8)} · {formatTimestamp(event.created_at)}
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