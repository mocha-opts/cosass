"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Target, Flame } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StatsPage() {
  const { data: stats, error } = useSWR("/api/stats", fetcher);

  if (error) return <div>Failed to load stats</div>;
  if (!stats) return <div>Loading...</div>;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">学习统计</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已读文章</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticlesRead}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学习单词</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWordsLearned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学习时长</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">连续天数</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              最长 {stats.longestStreak} 天
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 最近学习的文章 */}
      <Card>
        <CardHeader>
          <CardTitle>最近学习</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentProgress?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium">{item.article.title}</h4>
                <p className="text-sm text-gray-500">
                  {new Date(item.lastReadAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={item.readingProgress} className="w-20" />
                <Badge variant={item.isCompleted ? "default" : "secondary"}>
                  {item.isCompleted ? "完成" : `${item.readingProgress}%`}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}