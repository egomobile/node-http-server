# @egomobile/http-server benchmarks

The benchmarks were recorded with [wrk](https://github.com/wg/wrk) by executing the following command:

```bash
wrk -t8 -c100 -d30s http://localhost:3000/user/123
```

## Results

### Node v16.16.0

Machine:

- MacBook Pro (16", 2021)
- CPU: Apple M1 Max
- Memory: 64 GB
- OS: MacOS 13.0.1

Comparison:

| &nbsp;                   | `Express` | `fastify` | `polka` | `@egomobile/http-server` |
| ------------------------ | :-------: | :-------: | :-----: | :----------------------: |
| `Express`                |     -     |   104%    |   38%   |           34%            |
| `fastify`                |    96%    |     -     |   36%   |           32%            |
| `polka`                  |   267%    |   277%    |    -    |           91%            |
| `@egomobile/http-server` |   293%    |   304%    |  110%   |            -             |

Details:

#### [Express](https://expressjs.com/)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.53ms  710.38us  33.72ms   92.90%
    Req/Sec     3.42k   185.74     6.76k    95.62%
  817385 requests in 30.03s, 120.05MB read
Requests/sec:  27217.59
Transfer/sec:      4.00MB
```

#### [fastify](https://github.com/fastify/fastify)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.69ms  801.98us  28.05ms   84.54%
    Req/Sec     3.27k   186.68     5.80k    93.00%
  781641 requests in 30.04s, 128.96MB read
Requests/sec:  26018.04
Transfer/sec:      4.29MB
```

#### [Polka](https://github.com/lukeed/polka)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.34ms  379.99us  24.55ms   97.93%
    Req/Sec     9.07k   453.21     9.49k    95.06%
  2173208 requests in 30.10s, 271.50MB read
Requests/sec:  72196.10
Transfer/sec:      9.02MB
```

#### [@egomobile/http-server](https://github.com/egomobile/node-http-server)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.22ms  303.05us  19.87ms   97.71%
    Req/Sec     9.88k   496.24    10.32k    92.44%
  2367245 requests in 30.10s, 295.74MB read
Requests/sec:  78642.42
Transfer/sec:      9.82MB
```
