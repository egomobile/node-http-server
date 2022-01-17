# @egomobile/http-server benchmarks

The benchmarks were recorded with [wrk](https://github.com/wg/wrk) by executing the following command:

```bash
wrk -t8 -c100 -d30s http://localhost:3000/user/123
```

## Results

### Node v14.18.3

Machine:

- MacBook Pro (15-inch, 2018)
- CPU: 2,9 GHz 6-Core Intel Core i9
- Memory: 32 GB 2400 MHz DDR4
- OS: MacOS 12.1

#### [Express](https://expressjs.com/)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     6.90ms    1.49ms  51.33ms   87.93%
    Req/Sec     1.75k   159.86     1.95k    89.96%
  418653 requests in 30.01s, 61.49MB read
Requests/sec:  13949.86
Transfer/sec:      2.05MB
```

#### [fastify](https://github.com/fastify/fastify)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     6.27ms    1.19ms  23.25ms   82.08%
    Req/Sec     1.92k   109.35     2.18k    71.58%
  459204 requests in 30.02s, 75.32MB read
Requests/sec:  15296.53
Transfer/sec:      2.51MB
```

#### [Polka](https://github.com/lukeed/polka)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.81ms  789.55us  45.27ms   98.27%
    Req/Sec     4.33k   339.72     4.88k    95.06%
  1036950 requests in 30.10s, 129.55MB read
Requests/sec:  34445.83
Transfer/sec:      4.30MB
```

#### [@egomobile/http-server](https://github.com/egomobile/node-http-server)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.61ms  713.69us  42.06ms   97.40%
    Req/Sec     4.66k   382.90     5.81k    93.06%
  1115486 requests in 30.10s, 139.36MB read
Requests/sec:  37054.73
Transfer/sec:      4.63MB
```
