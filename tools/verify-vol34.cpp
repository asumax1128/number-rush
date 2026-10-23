// NUMBER×RUSH Vol.34: independent exhaustive five-mission safety verification.
// g++ -O3 -std=c++17 -Wall -Wextra tools/verify-vol34.cpp -o /tmp/verify34 && /tmp/verify34
// Six ordinary tiles and six reserved queue tiles, each in {1,2,3}.
// All TARGET-matching subsets count as player actions, including TARGET CLEAR.
#include <bits/stdc++.h>
using namespace std;
int main() {
 constexpr int N=729;
 int d[N][6], sum[N][64], count[64];
 uint32_t possible[N][5]{};
 for(int b=0;b<N;b++){int z=b;for(int i=0;i<6;i++){d[b][i]=z%3+1;z/=3;}}
 for(int mask=1;mask<64;mask++)count[mask]=__builtin_popcount((unsigned)mask);
 for(int b=0;b<N;b++)for(int mask=1;mask<64;mask++){
   int s=0,odd=0,even=0;
   for(int i=0;i<6;i++)if(mask>>i&1){
     s+=d[b][i];odd|=d[b][i]%2;even|=(d[b][i]%2==0);
   }
   sum[b][mask]=s;
   uint32_t bit=1u<<s;
   possible[b][0]|=bit;
   if(count[mask]==2)possible[b][1]|=bit;
   if(count[mask]==3)possible[b][2]|=bit;
   if(odd)possible[b][3]|=bit;
   if(even)possible[b][4]|=bit;
 }
 long long states=0,routes=0,valid[5]{},zero[5]{},totals[5]{};
 int lo[5]={99,99,99,99,99},hi[5]{};
 for(int b=0;b<N;b++)for(int q=0;q<N;q++){
   uint32_t common[19][5];bool seen[19]{};
   for(int t=0;t<19;t++)for(int j=0;j<5;j++)common[t][j]=(1u<<19)-2;
   for(int mask=1;mask<64;mask++){
     int t=sum[b][mask],after[6],k=0;
     for(int i=0;i<6;i++)after[i]=(mask>>i&1)?d[q][k++]:d[b][i];
     int code=0,p=1;
     for(int i=0;i<6;i++){code+=(after[i]-1)*p;p*=3;}
     seen[t]=true;routes++;
     for(int j=0;j<5;j++)common[t][j]&=possible[code][j];
   }
   for(int t=1;t<19;t++)if(seen[t]){
     states++;
     for(int j=0;j<5;j++){
       if(possible[b][j]&(1u<<t))valid[j]++;
       int c=__builtin_popcount(common[t][j]);
       zero[j]+=(c==0);totals[j]+=c;
       lo[j]=min(lo[j],c);hi[j]=max(hi[j],c);
     }
   }
 }
 const char* names[]={"FREE","PAIR","TRIPLE","ODD","EVEN"};
 cout<<"states="<<states<<" routes="<<routes<<"\n";
 for(int j=0;j<5;j++)
   cout<<names[j]<<" valid="<<valid[j]<<" zero="<<zero[j]
       <<" total="<<totals[j]<<" min="<<lo[j]<<" max="<<hi[j]<<"\n";
 const long long expectedValid[]={6234408,2088585,2307285,5977800,5083317};
 const long long expectedZero[]={0,0,17820,22344,1039260};
 const long long expectedTotals[]={69060354,20908809,21523251,64260198,50723061};
 const int expectedMin[]={4,1,0,0,0};
 const int expectedMax[]={15,5,6,14,13};
 bool ok=states==6234408LL && routes==33480783LL;
 for(int j=0;j<5;j++)ok &= valid[j]==expectedValid[j]
    && zero[j]==expectedZero[j] && totals[j]==expectedTotals[j]
    && lo[j]==expectedMin[j] && hi[j]==expectedMax[j];
 if(!ok){cerr<<"FAIL: Vol.34 exhaustive regression\n";return 1;}
 cout<<"PASS: Vol.34 five-mission safety verification\n";
}
